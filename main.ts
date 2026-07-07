import OpenAI from "openai";
import { ClientOptions } from "openai/client.js";

const provider = new OpenAI({
  baseURL,
})