"use client";

import { Button } from "./ui/button";
import { GitIcon, VercelIcon } from "./icons";
import Link from "next/link";

export const Navbar = () => {
  // Construct the Vercel deploy URL
  const repoUrl = "https://github.com/jericho1050/DineDiscover";
  const envVars = "TOGETHER_API_KEY,FOURSQUARE_API_KEY"; // Your required env variables
  const envDescription = "API keys needed for LLM and Foursquare";
  // Optional: Add a link to your .env.example if you create one
  // const envLink = "https://github.com/jericho1050/DineDiscover/blob/main/.env.local.example"; 
  
  // Encode parameters for the URL
  const vercelDeployUrl = `https://vercel.com/new/clone?repository-url=${encodeURIComponent(repoUrl)}&env=${encodeURIComponent(envVars)}&envDescription=${encodeURIComponent(envDescription)}`;
  // Add &envLink=${encodeURIComponent(envLink)} if you have an example file

  return (
    <div className="p-2 flex flex-row gap-2 justify-between">
      {/* Updated GitHub Link */}
      <Link href={repoUrl} target="_blank" rel="noopener noreferrer">
        <Button variant="outline">
          <GitIcon /> View Source Code
        </Button>
      </Link>

      {/* Updated Vercel Deploy Link */}
      <Link href={vercelDeployUrl} target="_blank" rel="noopener noreferrer">
        <Button>
          <VercelIcon />
          Deploy with Vercel
        </Button>
      </Link>
    </div>
  );
};