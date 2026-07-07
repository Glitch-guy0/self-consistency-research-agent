## overview
- This is a CLI-based tool. It's a simple tool — do not overcomplicate things.
- Needs to follow hexagonal patterns for external dependencies and provide sufficient configuration optionality for scale.
- I have all the system prompts for the research agent and validation agent. I need to plan a wrapper around this.

## architecture
(core LLM provider) ---> (wrapper <== web tool, note tool) ---> (loop <== new session notebook) -------> (TUI) -----> (user)

## agent tools
- websearch tool: Will use the **Jina Search API**, which takes a query and returns results in markdown — a great fit for this PoC.
- Note tool: this will be a KV dictionary for the LLM to store temporary data throughout its lifecycle. Each LLM will have its own note-taking object, not shared.

## flow
The flow of the project is:
- User provides a prompt to research (user query).
- Set up the current LLM session, stored in KV.
- Will trigger 3 APIs concurrently to answer this question.
- Each worker follows a chain of thought. The response includes a type field. If the type equals `output`, the response is complete; otherwise, save it into the session.
- During this process, the user will see `researching` in the terminal with 3 dots animating.
- After output is provided, the system goes through the validation agent.
- The validation agent's intermediate thinking process will be streamed to the user.
- Then the validation agent's output will be streamed to the user.

## session management
- This will be a KV store, i.e., using Redis.
- Global key will be `browser-agent` or `user-agent` + UUIDv4 passed from the frontend and stored in a cookie.
- This will be our session key for the LLM application.
- {key = sessionKey: value = {notebook, session}}
- notebook: [] array of notes
- Session: the LLM output is appended. After the output type is provided and the initial user query is answered, clear the intermediate thinking process.
- Lifecycle: research agent session terminates after output; validation agent session persists across turns.
```
session memory: user query -> (temporary thinking process) -> output
- after reply to user
session memory: user query -> output -> user query 2 -> output 2 ...
```

## jina working
- api with example are provided below.
- need to create an interface which like gives two api
- one search results and then ask for some selected list
- another method to parse webpages only for selected websites.
### web search 
```
curl "https://s.jina.ai/?q=Jina+AI" \
  -H "Authorization: Bearer jina_03901240b82c453193d94dfe40737f83AnVRdBKsi1zor4UY_p-uBqTzqt62" \
  -H "X-Respond-With: no-content"
```
### fetching content / parsing websites
```
curl "https://r.jina.ai/https://www.example.com" \
  -H "Authorization: Bearer jina_03901240b82c453193d94dfe40737f83AnVRdBKsi1zor4UY_p-uBqTzqt62"
```