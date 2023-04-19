import { events } from "bdsx/event";
import { resolve } from "path";
import { Store } from "./database/store";
import { StoreData } from "./types";
import { init as initLink } from "./commands/link";
import { Sweep } from "./sweep";

// Define server open and close event handlers
const handleServerOpen = async () => {
    console.log("[plugin:Tebexio] Startup");
    // Start the sweeper
    sweep.start();
    // Initialize commands
    initLink(store, sweep);
};

const handleServerClose = async () => {
    console.log("[plugin:Tebexio] Cleanup");
    // Stop the sweeper and save the store data
    sweep.stop();
    store.save();
};

// Subscribe to server open and close events
events.serverOpen.on(handleServerOpen);
events.serverClose.on(handleServerClose);

// Set up the store and sweeper
const store = new Store<StoreData>(resolve(__dirname, "../__STORE__/a.json"));
const sweep = new Sweep(store);
