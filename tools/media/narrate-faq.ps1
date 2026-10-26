$ErrorActionPreference = 'Stop'
$faqItems = Get-Content -Raw 'docs/research/dwell.au/faq.json' | ConvertFrom-Json
$narrator = New-Object -ComObject SAPI.SpVoice
$narrator.Rate = 1
foreach ($faqItem in $faqItems) {
  $audioStream = New-Object -ComObject SAPI.SpFileStream
  $audioPath = Join-Path (Get-Location) "public/videos/faq/$($faqItem.id).wav"
  $audioStream.Open($audioPath, 3, $false)
  $narrator.AudioOutputStream = $audioStream
  $null = $narrator.Speak($faqItem.answer)
  $audioStream.Close()
  Write-Output "Narrated $($faqItem.id)"
}
