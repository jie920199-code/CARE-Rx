$ErrorActionPreference = "Stop"

$approvedPrescriptions = Get-ChildItem "clinical-data/prescriptions" -File -Filter "*.json" |
  ForEach-Object { Get-Content $_.FullName -Raw -Encoding UTF8 | ConvertFrom-Json } |
  Where-Object { $_.status -eq "approved" }
$reviewRecords = Get-ChildItem "clinical-data/reviews" -File -Filter "*.json" |
  ForEach-Object { Get-Content $_.FullName -Raw -Encoding UTF8 | ConvertFrom-Json }

foreach ($prescription in $approvedPrescriptions) {
  if ($prescription.clinicalReview.status -ne "approved" -or
      [string]::IsNullOrWhiteSpace($prescription.clinicalReview.reviewerUserId) -or
      [string]::IsNullOrWhiteSpace($prescription.clinicalReview.reviewedAt)) {
    throw "Approved prescription $($prescription.prescriptionId) lacks complete clinical review metadata."
  }

  $review = $reviewRecords | Where-Object {
    $_.contentType -eq "prescription" -and
    $_.contentId -eq $prescription.prescriptionId -and
    $_.contentVersion -eq $prescription.version -and
    $_.decision -eq "approved"
  }
  if (@($review).Count -ne 1) {
    throw "Approved prescription $($prescription.prescriptionId) must have exactly one matching approved review record."
  }
  if ($review.reviewerUserId -ne $prescription.clinicalReview.reviewerUserId -or
      $review.reviewedAt -ne $prescription.clinicalReview.reviewedAt) {
    throw "Approved prescription $($prescription.prescriptionId) does not match its review identity or timestamp."
  }

  $pendingMarkers = $prescription | ConvertTo-Json -Depth 100 | Select-String '"reviewStatus"\s*:\s*"pending_clinical_review"'
  if ($pendingMarkers) {
    throw "Approved prescription $($prescription.prescriptionId) still contains pending review fields."
  }
}

foreach ($review in $reviewRecords | Where-Object { $_.decision -eq "approved" -and $_.contentType -eq "prescription" }) {
  $target = $approvedPrescriptions | Where-Object { $_.prescriptionId -eq $review.contentId -and $_.version -eq $review.contentVersion }
  if (@($target).Count -ne 1) {
    throw "Approved review $($review.reviewId) has no matching approved prescription version."
  }
}

Write-Host "Validated $(@($approvedPrescriptions).Count) approved prescriptions and $(@($reviewRecords).Count) clinical review records."
