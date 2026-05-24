$escrowId = "69f7827196b1ec2082132bdb"
$base = "http://localhost:8080/api"

Write-Host ""
Write-Host "===== STEP 1: ACCEPT AGREEMENT =====" -ForegroundColor Cyan
$r1 = Invoke-WebRequest -Uri "$base/escrow/$escrowId/accept" -Method POST -ContentType "application/json" -Body "{}" -UseBasicParsing
Write-Host $r1.Content

Write-Host ""
Write-Host "===== STEP 2: MARK AS DELIVERED =====" -ForegroundColor Cyan
$r2 = Invoke-WebRequest -Uri "$base/escrow/$escrowId/deliver" -Method POST -ContentType "application/json" -Body "{}" -UseBasicParsing
Write-Host $r2.Content

Write-Host ""
Write-Host "===== STEP 3: CONFIRM DELIVERY =====" -ForegroundColor Cyan
$r3 = Invoke-WebRequest -Uri "$base/escrow/$escrowId/confirm" -Method POST -ContentType "application/json" -Body "{}" -UseBasicParsing
Write-Host $r3.Content

Write-Host ""
Write-Host "===== FULL BLOCKCHAIN CHAIN =====" -ForegroundColor Green
$chain = Invoke-WebRequest -Uri "$base/blockchain/chain" -Method GET -UseBasicParsing
Write-Host $chain.Content

Write-Host ""
Write-Host "===== VALIDATE CHAIN =====" -ForegroundColor Green
$valid = Invoke-WebRequest -Uri "$base/blockchain/validate" -Method GET -UseBasicParsing
Write-Host $valid.Content

Write-Host ""
Write-Host "===== DONE =====" -ForegroundColor Yellow
