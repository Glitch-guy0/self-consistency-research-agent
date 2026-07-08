## for ituimanager
- add a composite pattern to this class called TerminalStyling (come up with a better name with same meaning)
- this will be optional to ituimanager
- this holds interface be like:
  - render({?color, ?bgcolor, ?opacity}) public => this is for providing control for user if he needs more control
  - success public wrapper internally calling this.render
  - fail public wrapper
  - warning public wrapper


- this will be optional to ituimanager and can be replasable with any other chalk like library
- if chalk provided then use it else just render to terminal directly.