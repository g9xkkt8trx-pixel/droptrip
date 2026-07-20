Add-Type -AssemblyName System.Drawing

$outputDirectory = Join-Path $PSScriptRoot '..\public\icons'
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null

function New-RoundedRectanglePath([System.Drawing.RectangleF]$rectangle, [single]$radius) {
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $diameter = $radius * 2
  $path.AddArc($rectangle.X, $rectangle.Y, $diameter, $diameter, 180, 90)
  $path.AddArc($rectangle.Right - $diameter, $rectangle.Y, $diameter, $diameter, 270, 90)
  $path.AddArc($rectangle.Right - $diameter, $rectangle.Bottom - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($rectangle.X, $rectangle.Bottom - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function New-DroptripIcon([string]$fileName, [int]$size, [bool]$maskable) {
  $bitmap = [System.Drawing.Bitmap]::new($size, $size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml($(if ($maskable) { '#1f7669' } else { '#f2f4f3' })))

  $inset = if ($maskable) { [int]($size * 0.18) } else { [int]($size * 0.08) }
  $card = [System.Drawing.RectangleF]::new($inset, $inset, $size - ($inset * 2), $size - ($inset * 2))
  $cardPath = New-RoundedRectanglePath $card ($size * 0.18)
  $cardBrush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($(if ($maskable) { '#f2f4f3' } else { '#ffffff' })))
  $graphics.FillPath($cardBrush, $cardPath)

  $center = $size / 2
  $scale = $size / 512
  $bolt = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $points = @(
    [System.Drawing.PointF]::new(287 * $scale, 78 * $scale),
    [System.Drawing.PointF]::new(163 * $scale, 276 * $scale),
    [System.Drawing.PointF]::new(241 * $scale, 276 * $scale),
    [System.Drawing.PointF]::new(218 * $scale, 434 * $scale),
    [System.Drawing.PointF]::new(359 * $scale, 219 * $scale),
    [System.Drawing.PointF]::new(277 * $scale, 219 * $scale)
  )
  $offset = $center - (256 * $scale)
  $translated = $points | ForEach-Object { [System.Drawing.PointF]::new($_.X + $offset, $_.Y + $offset) }
  $bolt.AddPolygon($translated)
  $boltBrush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#863bff'))
  $graphics.FillPath($boltBrush, $bolt)

  $blueBrush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#47bfff'))
  $graphics.FillEllipse($blueBrush, $center + (55 * $scale), $center + (78 * $scale), 36 * $scale, 36 * $scale)

  $bitmap.Save((Join-Path $outputDirectory $fileName), [System.Drawing.Imaging.ImageFormat]::Png)
  $blueBrush.Dispose(); $boltBrush.Dispose(); $bolt.Dispose(); $cardBrush.Dispose(); $cardPath.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
}

New-DroptripIcon 'droptrip-192.png' 192 $false
New-DroptripIcon 'droptrip-512.png' 512 $false
New-DroptripIcon 'droptrip-maskable-512.png' 512 $true
New-DroptripIcon 'droptrip-apple-touch-icon.png' 180 $false
