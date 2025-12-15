// Polyfill for Node Buffer in browser
import { Buffer } from "buffer";
window.Buffer = Buffer;

import "./js/app.js";