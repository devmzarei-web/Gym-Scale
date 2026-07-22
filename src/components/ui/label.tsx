"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-1.5 text-xs font-semibold text-slate-700 select-none mb-1",
        className
      )}
      {...props}
    />
  )
}

export { Label }
