import { motion } from "framer-motion";
import Link from "next/link";

// Consider adding a restaurant or search icon if you have one
import { MessageIcon, SparklesIcon } from "./icons"; 
import { LogoPython } from "@/app/icons";

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="rounded-xl p-6 flex flex-col gap-8 leading-relaxed text-center max-w-xl">
        {/* Updated Icons */}
        <p className="flex flex-row justify-center gap-4 items-center">
          <LogoPython size={32} />
          <span>+</span>
          <SparklesIcon size={32} /> {/* LLM Icon */}
          <span>+</span>
          <MessageIcon size={32} /> {/* Chat Icon */}
        </p>
        {/* Updated Description */}
        <p>
          Welcome to the DineDiscover!
        </p>
        <p>
          Enter a natural language query describing the restaurant you're looking for (e.g., "cheap sushi near downtown LA open now"). The system uses an LLM to understand your request, queries the{" "}
          <Link
            className="font-medium underline underline-offset-4"
            href="https://docs.foursquare.com/developer/reference/place-search"
            target="_blank"
          >
            Foursquare Places API
          </Link>
          , and displays the results.
        </p>
        <p>
          This application demonstrates using Python (
          <Link
            className="font-medium underline underline-offset-4"
            href="https://fastapi.tiangolo.com"
            target="_blank"
          >
            FastAPI
          </Link>
          ) for the backend API, an LLM for natural language processing, and React (with manual state management and API calls) for the frontend interface.
        </p>
      </div>
    </motion.div>
  );
};