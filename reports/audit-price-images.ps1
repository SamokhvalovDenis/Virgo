$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$projectPath = Split-Path -Parent $PSScriptRoot
$report = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot 'virgo-images.json') | ConvertFrom-Json
$outputPath = Join-Path $PSScriptRoot 'price-audit'
New-Item -ItemType Directory -Force -Path $outputPath | Out-Null
$entries = @($report.images | Where-Object { $_.status -eq 'downloaded' -and $_.originalUrl -like '*img1.wsimg.com/isteam/ip/278f614d*' } | Group-Object { ($_.originalUrl -split '/:/')[0] } | ForEach-Object {
  $best = $_.Group | Sort-Object bytes -Descending | Select-Object -First 1
  [pscustomobject]@{ file = $best.file; section = ($_.Group.section | Where-Object { $_ } | Sort-Object -Unique) -join ' / '; original = $_.Name; variants = @($_.Group.file | Sort-Object -Unique) }
})
$entries | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 (Join-Path $outputPath 'unique-images.json')
$font = New-Object System.Drawing.Font('Segoe UI', 10)
$brush = [System.Drawing.Brushes]::Black
for ($offset = 0; $offset -lt $entries.Count; $offset += 20) {
  $batch = @($entries | Select-Object -Skip $offset -First 20)
  $bitmap = New-Object System.Drawing.Bitmap(1200, ([int][Math]::Ceiling($batch.Count / 4.0) * 270))
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.Clear([System.Drawing.Color]::White)
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  for ($index = 0; $index -lt $batch.Count; $index++) {
    $entry = $batch[$index]
    $photoPath = Join-Path $projectPath ('public' + $entry.file)
    $photo = [System.Drawing.Image]::FromFile($photoPath)
    $x = ($index % 4) * 300
    $y = [int][Math]::Floor($index / 4) * 270
    $scale = [Math]::Min(286.0 / $photo.Width, 218.0 / $photo.Height)
    $width = [int]($photo.Width * $scale)
    $height = [int]($photo.Height * $scale)
    $graphics.DrawImage($photo, [int]($x + (300 - $width) / 2), $y + 4, $width, $height)
    $graphics.DrawString(('#' + ($offset + $index + 1) + ' ' + [IO.Path]::GetFileName($entry.file)), $font, $brush, $x + 5, $y + 225)
    $label = $entry.section
    if ($label.Length -gt 40) { $label = $label.Substring(0, 40) }
    $graphics.DrawString($label, $font, $brush, $x + 5, $y + 245)
    $photo.Dispose()
  }
  $destination = Join-Path $outputPath ('sheet-' + ([int]($offset / 20) + 1) + '.png')
  $bitmap.Save($destination, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
  Write-Output $destination
}
$font.Dispose()
Write-Output ('Unique studio image sources: ' + $entries.Count)
