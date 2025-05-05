"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RestaurantResultsProps {
  restaurants: string[]; // Expect an array of strings
}

export function RestaurantResults({ restaurants }: RestaurantResultsProps) {
  if (!restaurants || restaurants.length === 0) { // Check the passed prop directly
    return (
      <div className="text-center py-4">
        <p>No restaurants found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {restaurants.map((restaurantString, index) => {
        // Basic parsing: Split name and address
        const parts = restaurantString.split(" (");
        const name = parts[0];
        const address = parts.length > 1 ? `(${parts.slice(1).join(" (")}` : ""; // Re-add parenthesis if split

        return (
          // Use index as key if no unique ID is available in the string
          <Card key={index} className="overflow-hidden">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-lg">{name}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-sm text-gray-500">{address}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}