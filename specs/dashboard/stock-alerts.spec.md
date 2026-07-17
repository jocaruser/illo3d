# Dashboard — stock alerts

Lists materials at or below their warning thresholds, worst first.
Each item shows its name and current stock,
with a coloured edge — red, orange or amber —
for the severest threshold it crossed.
Pressing an item opens it in the inventory.

The thresholds themselves belong to each material
(a future `inventory/` spec owns them);
a threshold set to zero never alerts.

When nothing is low:
"All stock levels look healthy."
