# PowerShell script to fix Git history and push to GitHub
# This script will remove the large DockerDesktopInstaller.exe file from Git history

Write-Host "Step 1: Checking current Git status..." -ForegroundColor Green
git status

Write-Host "`nStep 2: Removing DockerDesktopInstaller.exe from Git history..." -ForegroundColor Green
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch DockerDesktopInstaller.exe" --prune-empty --tag-name-filter cat -- --all

Write-Host "`nStep 3: Cleaning up Git references..." -ForegroundColor Green
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

Write-Host "`nStep 4: Force pushing to GitHub..." -ForegroundColor Green
git push origin main --force

Write-Host "`nStep 5: Verifying push was successful..." -ForegroundColor Green
git status

Write-Host "`nDone! Check your GitHub repository now." -ForegroundColor Green 