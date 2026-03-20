export function mergeMessagesWithIds(
  clientMessages: Array<{ role: string; content: string }>,
  dbMessages: Array<{ id: string; role: string; content: string }>
): Array<{ role: string; content: string; id?: string }> {
  const userDbMessages = dbMessages.filter((m) => m.role === "user");
  let userIndex = 0;
  return clientMessages.map((m) => {
    if (m.role === "user" && userIndex < userDbMessages.length) {
      return {
        role: m.role,
        content: m.content,
        id: userDbMessages[userIndex++].id,
      };
    }
    return { role: m.role, content: m.content };
  });
}
