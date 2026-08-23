import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center py-2 cursor-pointer group", className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2.5 w-full grow overflow-hidden rounded-full bg-black/[0.06] backdrop-blur-md border border-white/60 shadow-[inset_0_1.5px_2px_rgba(0,0,0,0.06),0_1px_2px_rgba(255,255,255,0.8)]">
      <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-primary via-accent to-primary shadow-[0_0_12px_rgba(110,91,255,0.45)]" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full bg-white/95 backdrop-blur-xl border border-white shadow-[inset_0_1.5px_2px_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.08),0_4px_12px_rgba(110,91,255,0.3)] transition-transform duration-200 ease-out hover:scale-125 active:scale-140 hover:shadow-[inset_0_2px_3px_white,0_6px_18px_rgba(110,91,255,0.5)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
