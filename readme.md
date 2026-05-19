# Minesweeper Game

Minesweeper game built to practice the MVC and the Observable pattern.

This game was so much fun to implement. I believe this game is one of the best ways to actually learn how to write clean code.

I evolved the architecture by implementing the **Observable pattern**. My view layer extends a custom `Observable` class to emit events (like clicks and flags) which the controller subscribes to.

The flow works like this:

1. View captures user interactions and emits events via the `Observable` base class.
2. Controller listens to these events and tells the model to update.
3. Model processes the logic (like flood filling) and returns the updated state to the controller.
4. Controller tells the view to re-render the updated cells.

Additionally, I migrated to **TypeScript**, and making the overall codebase much cleaner and more maintainable to handle.

Without this pattern things can get messy really quickly.
