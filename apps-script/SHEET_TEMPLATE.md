# ARO CRM — Google Sheet lead-intake template

The Apps Script (`sheets-to-crm.gs`) pushes each new row into the CRM every minute.
Use **these exact column headers** in row 1 (any order, case-insensitive):

| name | phone | phone2 | source | campaign | project | unit type | status |
|------|-------|--------|--------|----------|---------|-----------|--------|

## What goes in each column

| Column | Meaning | Example |
|---|---|---|
| **name** | Lead full name | Ahmed Ali |
| **phone** | Primary phone | 01012345678 |
| **phone2** | Optional second phone | 01087654321 |
| **source** | Where the lead came from | Facebook · TikTok · Instagram · Referral · … (defaults to Facebook if blank) |
| **campaign** | The **actual ad-campaign name** | `Cali Coast - June - Lookalike` |
| **project** | The **development** the campaign promotes | `Cali Coast` |
| **unit type** | One of the canonical values below | `Chalet` |
| **status** | **Leave blank** — the script writes back `CRM` / `Duplicate` / `Error …` | *(auto)* |

## Canonical `unit type` values (pick one)

`Apartment` · `Duplex` · `Townhouse` · `Twinhouse` · `Standalone` · `Commercial` · `Admin` · `Clinic` · `Service Apartment` · `Chalet`

> For commercial/administrative developments (e.g. Sheraton Commercial), use `Commercial`, `Admin`, or `Clinic` as appropriate.

## ⚠️ Important — the columns changed

Previously the sheet had only **campaign** and **project**, and the development name was being typed into the **campaign** column while the unit type went into **project**. That is now fixed:

- **campaign** = the ad campaign (NOT the development)
- **project** = the development
- **unit type** = NEW column — the unit

Old rows already in the CRM will be corrected by a one-time migration. From now on, please fill the **three separate columns** as described above. If the sheet has no **unit type** column, the script still runs but treats the row as the old layout — so **add the `unit type` column** to switch to the corrected model.

## Example rows

| name | phone | source | campaign | project | unit type | status |
|---|---|---|---|---|---|---|
| Ahmed Ali | 01012345678 | Facebook | Cali Coast - June - LAL | Cali Coast | Chalet | |
| Sara Mohamed | 01098765432 | Instagram | Sheraton Commercial - Q2 | Sheraton Commercial | Commercial | |
| Omar Hassan | 01055554444 | TikTok | Naia Sahel - Reels | Naia Sahel | Twinhouse | |
