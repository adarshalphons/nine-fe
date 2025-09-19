
import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const categories = ["Dresses", "Tops", "Jeans", "Jackets", "Accessories"];
const sizes = ["XXS", "XS", "S", "M", "L", "XL", "XXL"];
const colors = [
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Green', hex: '#22c55e' },
    { name: 'Red', hex: '#ef4444' },
    { name: 'Beige', hex: '#f5f5dc' },
];

export default function FilterSidebar() {
  return (
    <aside className="w-full md:w-64 lg:w-72 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Filter By</h2>
        <Button variant="link" className="p-0 h-auto text-sm">Clear All</Button>
      </div>
      <Accordion type="multiple" defaultValue={['category', 'size']} className="w-full">
        <AccordionItem value="category">
          <AccordionTrigger className="font-medium">Category</AccordionTrigger>
          <AccordionContent className="pt-2 space-y-3">
            {categories.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox id={`cat-${category}`} />
                <Label htmlFor={`cat-${category}`} className="font-normal">{category}</Label>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="size">
          <AccordionTrigger className="font-medium">Size</AccordionTrigger>
          <AccordionContent className="pt-2 flex flex-wrap gap-2">
             {sizes.map((size) => (
              <Button key={size} variant="outline" size="sm" className="w-12 h-10">{size}</Button>
            ))}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="color">
          <AccordionTrigger className="font-medium">Color</AccordionTrigger>
          <AccordionContent className="pt-2 flex flex-wrap gap-3">
            {colors.map((color) => (
              <div key={color.name} className="flex items-center gap-2">
                <button className="w-6 h-6 rounded-full border border-gray-300" style={{ backgroundColor: color.hex }} title={color.name}></button>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </aside>
  );
}
