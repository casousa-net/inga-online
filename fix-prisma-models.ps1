# Script para corrigir nomes de modelos Prisma em todos os arquivos
$apiDir = "c:\Users\Orlando Nzagi\Desktop\inga-online\app\api"

# Substituir solicitacaoAutorizacao por solicitacaoautorizacao
Get-ChildItem -Path $apiDir -Recurse -Filter "*.ts" | 
ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $newContent = $content -replace "solicitacaoAutorizacao", "solicitacaoautorizacao"
    if ($content -ne $newContent) {
        Set-Content -Path $_.FullName -Value $newContent
        Write-Host "Atualizado: $($_.FullName)"
    }
}

# Substituir codigoPautal por codigopautal
Get-ChildItem -Path $apiDir -Recurse -Filter "*.ts" | 
ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $newContent = $content -replace "codigoPautal", "codigopautal"
    if ($content -ne $newContent) {
        Set-Content -Path $_.FullName -Value $newContent
        Write-Host "Atualizado: $($_.FullName)"
    }
}

# Substituir documentoSolicitacao por documentosolicitacao
Get-ChildItem -Path $apiDir -Recurse -Filter "*.ts" | 
ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $newContent = $content -replace "documentoSolicitacao", "documentosolicitacao"
    if ($content -ne $newContent) {
        Set-Content -Path $_.FullName -Value $newContent
        Write-Host "Atualizado: $($_.FullName)"
    }
}

# Substituir solicitacaoItem por solicitacaoitem
Get-ChildItem -Path $apiDir -Recurse -Filter "*.ts" | 
ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $newContent = $content -replace "solicitacaoItem", "solicitacaoitem"
    if ($content -ne $newContent) {
        Set-Content -Path $_.FullName -Value $newContent
        Write-Host "Atualizado: $($_.FullName)"
    }
}

# Substituir itens por solicitacaoitem nos includes
Get-ChildItem -Path $apiDir -Recurse -Filter "*.ts" | 
ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $newContent = $content -replace "include: \{\s*utente: true,\s*moeda: true,\s*itens:", "include: {\n        utente: true,\n        moeda: true,\n        solicitacaoitem:"
    if ($content -ne $newContent) {
        Set-Content -Path $_.FullName -Value $newContent
        Write-Host "Atualizado itens para solicitacaoitem: $($_.FullName)"
    }
}

# Substituir documentos por documentosolicitacao nos includes
Get-ChildItem -Path $apiDir -Recurse -Filter "*.ts" | 
ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $newContent = $content -replace "documentos: true", "documentosolicitacao: true"
    if ($content -ne $newContent) {
        Set-Content -Path $_.FullName -Value $newContent
        Write-Host "Atualizado documentos para documentosolicitacao: $($_.FullName)"
    }
}

Write-Host "Concluído! Todos os arquivos foram atualizados."
