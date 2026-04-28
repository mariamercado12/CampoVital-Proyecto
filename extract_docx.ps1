param([string]$FilePath)
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($FilePath)
$entry = $zip.GetEntry("word/document.xml")
if ($null -eq $entry) {
    Write-Output "No word/document.xml found."
    $zip.Dispose()
    exit
}
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$xml = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()

# The text is mostly inside <w:t> tags. 
# Let's extract everything inside <w:t> tags to avoid getting formatting properties.
$pattern = '(?s)<w:t[^>]*>(.*?)</w:t>'
$matches = [regex]::Matches($xml, $pattern)
$result = ""
foreach ($match in $matches) {
    $result += $match.Groups[1].Value + "`n"
}

# Unescape common XML entities
$result = $result -replace '&amp;', '&' -replace '&lt;', '<' -replace '&gt;', '>' -replace '&quot;', '"' -replace '&apos;', "'"

Out-File -FilePath "c:\Users\HP\Documents\PROYECTO ARQUITECTURA\doc_text.txt" -InputObject $result -Encoding UTF8
Write-Output "Extracted text to doc_text.txt"
