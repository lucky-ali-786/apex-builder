export function lastAssistantTextMessageContent(result) {
  // 🚨 THE FIX: Guard against null, undefined, or missing outputs
  if (!result || !result.output || !Array.isArray(result.output)) {
    return null;
  }

  // Safely find the text block (ignoring tool calls/responses)
  const textOutput = result.output.find(out => out.type === "text");
  
  if (!textOutput) {
    return null; 
  }

  // Handle both array and string content safely
  return Array.isArray(textOutput.content) 
    ? textOutput.content.join("") 
    : textOutput.content;
}