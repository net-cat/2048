function Grid(size, previousState) {
  this.size = size;
  this.cells = previousState ? this.fromState(previousState) : this.empty();
}

// Build a grid of the specified size
Grid.prototype.empty = function () {
  var cells = [];

  for (var x = 0; x < this.size; x++) {
    var row = cells[x] = [];

    for (var y = 0; y < this.size; y++) {
      row.push(null);
    }
  }

  return cells;
};

Grid.prototype.fromState = function (state) {
  var cells = [];

  for (var x = 0; x < this.size; x++) {
    var row = cells[x] = [];

    for (var y = 0; y < this.size; y++) {
      var tile = state[x][y];
      row.push(tile ? new Tile(tile.position, tile.value) : null);
    }
  }

  return cells;
};

// Filter occupied cells out of array
Grid.prototype.filterOccupiedCellsFromArray = function (cells) {
  var available = [];
  cells.forEach(function(cell) {
    if ( this.cellAvailable(cell) ) {
      available.push(cell)
    }
  }, this);
  return available;
};

// Find largest numbered cell in grid
Grid.prototype.findLargestCell = function(cap) {
  return this.findLargestCellUnder(false);
};

// Find largest numbered cell in grid under cap
Grid.prototype.findLargestCellUnder = function(cap) {
  var highest = {value:0};
  this.eachCell(function (x, y, tile) {
    if ( tile ) {
      if ( tile.value > highest.value ) {
        if ( !cap || cap > tile.value ) {
          highest = tile;
        }
      }
    }
  });
  return highest;
};

// Find the first available random position
Grid.prototype.randomAvailableCell = function () {
  var highest = this.findLargestCell();
  var cells = [];

  // Until we get to 128, game plays normally.
  if ( highest.value >= 128 ) {
    // First, try to add a block between the largest block we can and the wall.
    var bastard_cells = [];
    var capped_highest = highest;
    while(capped_highest.value >= 32) {
      if ( capped_highest.x == 1 ) {
        bastard_cells.push({x: 0, y: capped_highest.y});
      }
      if ( capped_highest.x == 2 ) {
        bastard_cells.push({x: 3, y: capped_highest.y});
      }
      if ( capped_highest.y == 1 ) {
        bastard_cells.push({x: capped_highest.x, y: 0});
      }
      if ( capped_highest.y == 2 ) {
        bastard_cells.push({x: capped_highest.x, y: 3});
      }
      cells = this.filterOccupiedCellsFromArray(bastard_cells);
      if ( cells.length ) {
        break;
      }
      capped_highest = this.findLargestCellUnder(capped_highest.value);
    }
    cells = this.filterOccupiedCellsFromArray(bastard_cells);

    // If we can't do that, try to force a block to move by keeping edges empty.
    var emptiestEdge = [];
    if (!cells.length) {
      var edgeX0 = this.filterOccupiedCellsFromArray([{x:0,y:0},{x:0,y:1},{x:0,y:2},{x:0,y:3}]);
      var edgeX3 = this.filterOccupiedCellsFromArray([{x:3,y:0},{x:3,y:1},{x:3,y:2},{x:3,y:3}]);
      var edgeY0 = this.filterOccupiedCellsFromArray([{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:3,y:0}]);
      var edgeY3 = this.filterOccupiedCellsFromArray([{x:0,y:3},{x:1,y:3},{x:2,y:3},{x:3,y:3}]);
      var edges = [edgeX0, edgeX3, edgeY0, edgeY3];

      edges.forEach(function(edge) {
        if ( emptiestEdge.length < edge.length ) {
          emptiestEdge = edge;
        }
      });

      cells = this.availableCells();
      emptiestEdge.forEach(function(cell) {
        for ( var i = 0; i < cells.length; ++i ) {
          if ( cells[i].x == cell.x && cells[i].y == cell.y ) {
            cells.splice(i, 1);
            break;
          }
        }
       });
    }
  }

  // Finally, just pick a random cell if we can't do anything else.
  if (!cells.length) {
    cells = this.availableCells();
  }

  if (cells.length) {
    return cells[Math.floor(Math.random() * cells.length)];
  }
};

Grid.prototype.availableCells = function () {
  var cells = [];

  this.eachCell(function (x, y, tile) {
    if (!tile) {
      cells.push({ x: x, y: y });
    }
  });

  return cells;
};

// Call callback for every cell
Grid.prototype.eachCell = function (callback) {
  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      callback(x, y, this.cells[x][y]);
    }
  }
};

// Check if there are any cells available
Grid.prototype.cellsAvailable = function () {
  return !!this.availableCells().length;
};

// Check if the specified cell is taken
Grid.prototype.cellAvailable = function (cell) {
  return !this.cellOccupied(cell);
};

Grid.prototype.cellOccupied = function (cell) {
  return !!this.cellContent(cell);
};

Grid.prototype.cellContent = function (cell) {
  if (this.withinBounds(cell)) {
    return this.cells[cell.x][cell.y];
  } else {
    return null;
  }
};

// Inserts a tile at its position
Grid.prototype.insertTile = function (tile) {
  this.cells[tile.x][tile.y] = tile;
};

Grid.prototype.removeTile = function (tile) {
  this.cells[tile.x][tile.y] = null;
};

Grid.prototype.withinBounds = function (position) {
  return position.x >= 0 && position.x < this.size &&
         position.y >= 0 && position.y < this.size;
};

Grid.prototype.serialize = function () {
  var cellState = [];

  for (var x = 0; x < this.size; x++) {
    var row = cellState[x] = [];

    for (var y = 0; y < this.size; y++) {
      row.push(this.cells[x][y] ? this.cells[x][y].serialize() : null);
    }
  }

  return {
    size: this.size,
    cells: cellState
  };
};
