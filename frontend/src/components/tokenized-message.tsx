"use client"

import { TokenTooltip } from "@/components/token-tooltip"

type TokenData = {
  index: number
  blurb: string
  word?: string
}

type TokenizedMessageProps = {
  content: string
  tokenMetadata?: TokenData[]
}

export function TokenizedMessage({ content, tokenMetadata }: TokenizedMessageProps) {
  // If no token metadata, render plain text
  if (!tokenMetadata || tokenMetadata.length === 0) {
    return <span>{content}</span>
  }

  // Sort tokens by index for proper rendering
  const sortedTokens = [...tokenMetadata].sort((a, b) => a.index - b.index)
  
  // Create a map of character positions to token data for efficient lookup
  const tokenMap = new Map<number, TokenData>()
  
  // Also create a word-based lookup for better matching
  sortedTokens.forEach(token => {
    tokenMap.set(token.index, token)
    
    // If we have word information, try to match by word content as well
    if (token.word) {
      // Find all occurrences of this word in the text
      let searchIndex = 0
      while (true) {
        const wordIndex = content.indexOf(token.word, searchIndex)
        if (wordIndex === -1) break
        
        // Check if this is a word boundary (not part of a larger word)
        const beforeChar = wordIndex > 0 ? content[wordIndex - 1] : ' '
        const afterChar = wordIndex + token.word.length < content.length ? content[wordIndex + token.word.length] : ' '
        
        if (!/\w/.test(beforeChar) && !/\w/.test(afterChar)) {
          tokenMap.set(wordIndex, token)
        }
        
        searchIndex = wordIndex + 1
      }
    }
  })

  // Split content into words while preserving spaces and punctuation
  const parts = content.split(/(\s+|[.,!?;:¿¡])/)
  let currentIndex = 0
  
  const elements: React.ReactNode[] = []

  parts.forEach((part, i) => {
    const partStartIndex = currentIndex
    
    // Check if this part has token metadata
    const tokenAtPosition = tokenMap.get(partStartIndex)
    
    if (tokenAtPosition && part.trim().length > 0 && /\w/.test(part)) {
      // This part has token metadata and is a word (not just whitespace/punctuation)
      elements.push(
        <TokenTooltip key={`token-${i}`} blurb={tokenAtPosition.blurb}>
          {part}
        </TokenTooltip>
      )
    } else {
      // Regular text, whitespace, or punctuation
      elements.push(
        <span key={`text-${i}`}>{part}</span>
      )
    }
    
    currentIndex += part.length
  })

  return <span>{elements}</span>
}