# ============================================================
# push-to-github.ps1 —— 用 gh API 推送本地仓库到 GitHub（绕过被墙的 git 协议）
# ------------------------------------------------------------
# 背景: github.com 的 git 协议(443)被 SNI 阻断, 但 api.github.com 正常。
#       所以用 GitHub Git Data API 模拟 git push:
#         1. 读取所有文件 → base64 → 创建 blob
#         2. 用 blobs 建 tree
#         3. 用 tree + parent commit 建 commit
#         4. 更新 main 分支引用指向新 commit
# 用法: powershell -ExecutionPolicy Bypass -File push-to-github.ps1
# 注意: JSON body 必须无 BOM(带 BOM 会 400 "Problems parsing JSON")
# ============================================================
$ErrorActionPreference = 'Continue'

# ---------- 配置 ----------
$repo = "qtbsjy/task-manager"
$branch = "main"
$message = "feat: task-manager 全量代码 - UiKit深度消费/暗色主题/UiTable/12测试 (作品07+27)"
# 排除的文件/目录
$exclude = @(
  '.git', 'node_modules', 'dist', 'dist-ssr', 'coverage',
  'preview.log', 'preview2.log', 'pv.log', 'verify-dev.mjs',
  '.gitkeep'
)
$tmpDir = Join-Path $env:TEMP ("push-gh-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null

# 无 BOM UTF8 写入 JSON(避免 gh 400)
function Write-JsonNoBom($path, $obj) {
  $json = $obj | ConvertTo-Json -Depth 6 -Compress
  $enc = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($path, $json, $enc)
}

# ---------- 收集文件 ----------
function Get-Files($dir) {
  $result = @()
  foreach ($item in Get-ChildItem $dir -Force) {
    if ($exclude -contains $item.Name) { continue }
    if ($item.PSIsContainer) {
      $result += Get-Files $item.FullName
    } else {
      $result += $item.FullName
    }
  }
  return $result
}

$root = (Get-Location).Path
$allFiles = Get-Files $root
Write-Host "共 $($allFiles.Count) 个文件待推送..."

# ---------- 1. 创建 blobs ----------
$blobs = New-Object System.Collections.ArrayList
foreach ($f in $allFiles) {
  $rel = $f.Substring($root.Length + 1).Replace('\', '/')
  $bytes = [System.IO.File]::ReadAllBytes($f)
  $b64 = [Convert]::ToBase64String($bytes)
  $bodyFile = Join-Path $tmpDir "blob.json"
  Write-JsonNoBom $bodyFile @{ content = $b64; encoding = 'base64' }
  $resp = gh api "repos/$repo/git/blobs" -X POST --input $bodyFile 2>$null | ConvertFrom-Json
  if ($resp.sha) {
    [void]$blobs.Add(@{ path = $rel; sha = $resp.sha; mode = '100644'; type = 'blob' })
  } else {
    Write-Host "  [FAIL] $rel"
  }
}
Write-Host "  blobs 创建完成: $($blobs.Count) 个"

# ---------- 2. 建 tree ----------
if ($blobs.Count -eq 0) { Write-Host "错误: 无 blob, 终止"; exit 1 }
$treeFile = Join-Path $tmpDir "tree.json"
Write-JsonNoBom $treeFile @{ tree = @($blobs) }
$treeResp = gh api "repos/$repo/git/trees" -X POST --input $treeFile 2>$null | ConvertFrom-Json
$treeSha = $treeResp.sha
Write-Host "Tree 创建: $treeSha"

# ---------- 3. 建 commit(引用当前 main HEAD 为 parent) ----------
$head = (gh api "repos/$repo/branches/$branch" 2>$null | ConvertFrom-Json).commit.sha
Write-Host "当前 HEAD: $head"
$commitFile = Join-Path $tmpDir "commit.json"
Write-JsonNoBom $commitFile @{ message = $message; tree = $treeSha; parents = @($head) }
$commitResp = gh api "repos/$repo/git/commits" -X POST --input $commitFile 2>$null | ConvertFrom-Json
$commitSha = $commitResp.sha
Write-Host "Commit 创建: $commitSha"

# ---------- 4. 更新分支引用 ----------
if (-not $commitSha) { Write-Host "错误: 无 commit, 终止"; exit 1 }
$refFile = Join-Path $tmpDir "ref.json"
Write-JsonNoBom $refFile @{ sha = $commitSha }
$refResp = gh api "repos/$repo/git/refs/heads/$branch" -X PATCH --input $refFile 2>$null
Write-Host "分支 $branch 更新完成"
Write-Host $refResp

# 清理
Remove-Item $tmpDir -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "`n✅ 全部推送完成!"
