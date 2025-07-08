require("dotenv").config();
const express = require("express");
const cron = require("node-cron");

const { getApartmentAvailability } = require("./rentcafeAvailability");
const { getAllItemsFromWebflow, updateWebflowItemsLive } = require("./webflow");
const { syncWithWebflow } = require("./webflowSync");

const app = express();

async function runSyncJob() {
  console.log("Starting sync job at:", new Date().toLocaleString());

  const rentCafeData = await getApartmentAvailability(
    "yardi@wearewherever.com",
    process.env.RENTCAFE_VENDOR_TOKEN_SATURDAY,
    process.env.RENTCAFE_COMPANY_CODE_SATURDAY,
    process.env.RENTCAFE_PROPERTY_CODE_REVELRY
  );

  const webflowItems = await getAllItemsFromWebflow(
    process.env.WEBFLOW_TOKEN_REVELRY,
    process.env.WEBFLOW_COLLECTION_ID_REVELRY
  );

  await syncWithWebflow(
    rentCafeData.apartmentAvailabilities || [],
    webflowItems,
    process.env.WEBFLOW_TOKEN_REVELRY,
    process.env.WEBFLOW_COLLECTION_ID_REVELRY
  );

  console.log("Sync complete at:", new Date().toLocaleString());
}

cron.schedule("0 */4 * * *", async () => {
  console.log("Cron triggered (every 4 hours).");
  await runSyncJob();
});

app.get("/sync", async (req, res) => {
  try {
    await runSyncJob();
    res.send("Sync complete!");
  } catch (error) {
    console.error("Error in /sync route:", error.message);
    res.status(500).send("Something went wrong during sync.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});