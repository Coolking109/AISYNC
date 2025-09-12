import { NextRequest, NextResponse } from 'next/server';

// Note: This route uses Node.js packages and cannot use edge runtime



// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json(
        { success: false, message: 'Query is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Web search API called for: "${query}"`);

    // Try multiple search strategies
    let searchResults: string[] = [];
    
    // Strategy 1: Try Wikipedia search first
    searchResults = await searchWikipedia(query);
    
    // Strategy 2: If Wikipedia fails, try searching for the person specifically
    if (searchResults.length === 0) {
      searchResults = await searchForPerson(query);
    }
    
    // Strategy 3: If still no results, provide a general informational response
    if (searchResults.length === 0) {
      searchResults = await provideGeneralResponse(query);
    }

    console.log(`✅ Web search completed. Found ${searchResults.length} results.`);

    return NextResponse.json({
      success: true,
      results: searchResults,
      source: searchResults.length > 0 ? 'web-search' : 'general'
    });

  } catch (error) {
    console.error('Web search API error:', error);
    return NextResponse.json(
      { success: false, message: 'Search failed', results: [] },
      { status: 500 }
    );
  }
}

// Search Wikipedia for information
async function searchWikipedia(query: string): Promise<string[]> {
  try {
    console.log(`📚 Trying Wikipedia search for: "${query}"`);
    
    // Extract potential Wikipedia search terms
    const searchTerms = extractSearchTerms(query);
    
    for (const term of searchTerms) {
      try {
        const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`;
        const response = await fetch(searchUrl);
        
        if (response.ok) {
          const data = await response.json();
          const results: string[] = [];
          
          if (data.extract) {
            results.push(data.extract);
            console.log(`✅ Wikipedia found information for: "${term}"`);
            return results;
          }
        }
      } catch (err) {
        console.log(`❌ Wikipedia search failed for term: "${term}"`);
      }
    }
    
    return [];
  } catch (error) {
    console.error('Wikipedia search error:', error);
    return [];
  }
}

// Extract meaningful search terms from the query
function extractSearchTerms(query: string): string[] {
  const terms: string[] = [];
  const queryLower = query.toLowerCase();
  
  // If asking about a specific person, extract the name
  const nameMatch = queryLower.match(/(?:who|what|about|killed|happened to|is)\s+(.+?)(?:\s|$)/);
  if (nameMatch) {
    const extractedName = nameMatch[1].trim();
    // Clean up common question words
    const cleanName = extractedName
      .replace(/\b(killed|died|dead|happened|to|is|was|are|were|the|a|an)\b/g, '')
      .trim()
      .replace(/\s+/g, ' ');
    
    if (cleanName.length > 2) {
      terms.push(cleanName);
    }
  }
  
  // Also try the original query
  terms.push(query);
  
  // Extract individual significant words (names, nouns)
  const words = query.split(/\s+/).filter(word => 
    word.length > 3 && 
    !['what', 'who', 'when', 'where', 'why', 'how', 'killed', 'died', 'the', 'and', 'or'].includes(word.toLowerCase())
  );
  
  terms.push(...words);
  
  return [...new Set(terms)]; // Remove duplicates
}

// Search specifically for people
async function searchForPerson(query: string): Promise<string[]> {
  console.log(`👤 Trying person-specific search for: "${query}"`);
  
  const queryLower = query.toLowerCase();
  
  // Extract person name
  const nameMatch = queryLower.match(/(?:who|what|about|killed|happened to|is)\s+(.+?)(?:\s|$)/);
  if (nameMatch) {
    const extractedName = nameMatch[1]
      .replace(/\b(killed|died|dead|happened|to|is|was|are|were|the|a|an)\b/g, '')
      .trim();
    
    if (extractedName.length > 2) {
      // Try searching Wikipedia for the person
      try {
        const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(extractedName)}`;
        const response = await fetch(searchUrl);
        
        if (response.ok) {
          const data = await response.json();
          if (data.extract) {
            console.log(`✅ Found person information for: "${extractedName}"`);
            return [data.extract];
          }
        }
      } catch (err) {
        console.log(`❌ Person search failed for: "${extractedName}"`);
      }
    }
  }
  
  return [];
}

// Provide a general informational response when searches fail
async function provideGeneralResponse(query: string): Promise<string[]> {
  console.log(`💭 Providing general response for: "${query}"`);
  
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('killed') || queryLower.includes('died') || queryLower.includes('death')) {
    return [
      "I don't have specific information about this person or event in my current knowledge base. If you're asking about a public figure, you might want to check reliable news sources or official records for accurate information about their status or any events involving them."
    ];
  }
  
  if (queryLower.includes('who is') || queryLower.includes('what is')) {
    return [
      "I don't have specific information about this topic in my current database. Could you provide more context or try rephrasing your question? I'm always learning and expanding my knowledge base."
    ];
  }
  
  // Generic response for other types of questions
  const keywords = query.split(' ').filter(word => word.length > 3);
  return [
    `I searched for information about "${keywords.slice(0, 3).join(', ')}" but couldn't find specific details in my current sources. This might be a very recent event, a local matter, or require specialized knowledge. Could you provide more context or check authoritative sources for the most accurate information?`
  ];
}
