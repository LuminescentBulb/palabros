"use client"

import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

type TokenTooltipProps = {
  children: React.ReactNode
  blurb: string
}

export function TokenTooltip({ children, blurb }: TokenTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help hover:bg-blue-100 hover:text-blue-800 px-0.5 rounded-sm transition-colors duration-200">
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-sm bg-gray-800 text-white border-gray-600">
          <div className="text-sm whitespace-pre-wrap p-2">
            {blurb}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}