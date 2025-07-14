import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground bg-background bg-opacity-50 backdrop-blur-sm border-input border-opacity-50 flex h-10 w-full min-w-0 rounded-md border-2 px-3 py-1 text-base shadow-sm transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "hover:border-input hover:bg-background hover:bg-opacity-70",
        "focus:border-primary focus:border-opacity-50 focus:bg-background focus:ring-2 focus:ring-primary focus:ring-opacity-20 focus:ring-offset-1 focus:ring-offset-background",
        "aria-invalid:ring-destructive aria-invalid:ring-opacity-20 aria-invalid:border-destructive aria-invalid:focus:ring-destructive aria-invalid:focus:ring-opacity-40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
