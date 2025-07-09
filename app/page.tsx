'use client';

import React, {useState} from 'react';

export default function GridfinityPlanner() {
  const [colors, setColors] = useState<{ color: string, label: string }[]>([
    {color: '#1e293b', label: 'Slate'},
    {color: '#f87171', label: 'Red'},
    {color: '#60a5fa', label: 'Blue'},
    {color: '#34d399', label: 'Green'},
    {color: '#fbbf24', label: 'Yellow'},
    {color: '#a78bfa', label: 'Purple'}
  ]);
  const [selectedColor, setSelectedColor] = useState(0);
  const [x, setX] = useState(16);
  const [y, setY] = useState(13);
  const [grid, setGrid] = useState<number[][]>(
      Array.from({length: 13}, () => Array(16).fill(0))
  );
  const [mmToCellsX, setMMToCellsX] = useState<number>(42);
  const [mmToCellsY, setMMToCellsY] = useState<number>(42);

  // Rectangle selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ row: number, col: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ row: number, col: number } | null>(null);

  const handleCellMouseDown = (row: number, col: number) => {
    setIsSelecting(true);
    setSelectionStart({row, col});
    setSelectionEnd({row, col});
  };

  const handleCellMouseEnter = (row: number, col: number) => {
    if (isSelecting) {
      setSelectionEnd({row, col});
    }
  };

  const handleCellMouseUp = () => {
    if (isSelecting && selectionStart && selectionEnd) {
      const minRow = Math.min(selectionStart.row, selectionEnd.row);
      const maxRow = Math.max(selectionStart.row, selectionEnd.row);
      const minCol = Math.min(selectionStart.col, selectionEnd.col);
      const maxCol = Math.max(selectionStart.col, selectionEnd.col);

      setGrid(prev =>
          prev.map((r, i) =>
              r.map((cell, j) =>
                  i >= minRow && i <= maxRow && j >= minCol && j <= maxCol
                      ? selectedColor
                      : cell
              )
          )
      );
    }
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  const handleSizeChange = (newX: number, newY: number) => {
    setX(newX);
    setY(newY);
    setGrid(Array.from({length: newY}, (_, row) =>
        Array.from({length: newX}, (_, col) => (grid[row]?.[col] ?? 0))
    ));
  };

  // Export functionality
  const handleExport = () => {
    const data = {
      colors,
      grid,
      x,
      y
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gridfinity-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import functionality
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data.colors) && Array.isArray(data.grid) && typeof data.x === 'number' && typeof data.y === 'number') {
          setColors(data.colors);
          setGrid(data.grid);
          setX(data.x);
          setY(data.y);
        } else {
          alert('Invalid file format.');
        }
      } catch {
        alert('Failed to import file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Helper to check if a cell is in the current selection rectangle
  const isCellInSelection = (i: number, j: number) => {
    if (!isSelecting || !selectionStart || !selectionEnd) return false;
    const minRow = Math.min(selectionStart.row, selectionEnd.row);
    const maxRow = Math.max(selectionStart.row, selectionEnd.row);
    const minCol = Math.min(selectionStart.col, selectionEnd.col);
    const maxCol = Math.max(selectionStart.col, selectionEnd.col);
    return i >= minRow && i <= maxRow && j >= minCol && j <= maxCol;
  };

  return (
      <main
          style={{padding: 24}}
          className="w-full h-full"
          onMouseUp={handleCellMouseUp}
          onMouseLeave={handleCellMouseUp}
      >
        <h1 className="w-1/2">Gridfinity Drawer Planner</h1>
        <div className="flex w-full h-full">
          {/* Left Panel: Grid Controls and Grid */}
          <section className="w-1/2">
            <div className="flex flex-col gap-4 mt-4 w-full" style={{marginBottom: 16}}>
              <div className="flex w-full gap-4 justify-between">
                {/* Grid Size Controls */}
                <div className="flex w-1/3 flex-col gap-4">
                  {['X', 'Y'].map((axis, idx) => (
                      <label key={axis} className="flex gap-2 w-full items-center">
                        {axis}:
                        <input
                            type="number"
                            min={1}
                            value={idx === 0 ? x : y}
                            onChange={e =>
                                handleSizeChange(
                                    idx === 0 ? Number(e.target.value) : x,
                                    idx === 1 ? Number(e.target.value) : y
                                )
                            }
                            className="flex w-full items-center"
                        />
                      </label>
                  ))}
                </div>
                {/* millimeters to grid container */}
                <div className="flex gap-4 flex-col w-full">
                  <div className="flex gap-2 items-center">
                    <input
                        type="number"
                        className="w-1/3"
                        value={mmToCellsX}
                        onChange={e => setMMToCellsX(Number(e.target.value))}
                    />
                    <label className={`text-2xl`}>= {Math.ceil((mmToCellsX + 10) / 42)} cells</label>
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                        type="number"
                        className="w-1/3"
                        value={mmToCellsY}
                        onChange={e => setMMToCellsY(Number(e.target.value))}
                    />
                    <label className={`text-2xl`}>= {Math.ceil((mmToCellsY + 10) / 42)} cells</label>
                  </div>
                </div>
              </div>
              {/* Export/Import Buttons */}
              <div className="flex gap-2">
                <button
                    onClick={handleExport}
                    className="px-2 py-1 border rounded bg-neutral-800 text-white"
                >
                  Export
                </button>
                <label
                    className="flex items-center p-2 border rounded-md bg-neutral-800 text-white cursor-pointer">
                  Import
                  <input
                      key="fileInput"
                      type="file"
                      accept="application/json"
                      onChange={handleImport}
                      style={{display: 'none'}}
                  />
                </label>
              </div>
            </div>
            {/* Grid Display */}
            <h2 className="text-center text-2xl font-semibold">X</h2>
            <div className="flex h-fit gap-2">
              <h2 className="text-2xl font-semibold translate-y-[48%]">Y</h2>
              <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${x}, 64px)`,
                    gridTemplateRows: `repeat(${y}, 64px)`,
                    gap: 2,
                    padding: 8,
                    borderRadius: 8,
                    width: 'fit-content',
                    height: 'fit-content',
                  }}
                  className="bg-neutral-700"
              >
                {grid.map((row, i) =>
                    row.map((cell, j) => {
                      const selected = isCellInSelection(i, j);
                      return (
                          <div
                              key={`${i}-${j}`}
                              onMouseDown={() => handleCellMouseDown(i, j)}
                              onMouseEnter={() => handleCellMouseEnter(i, j)}
                              onMouseUp={handleCellMouseUp}
                              style={{
                                width: 64,
                                height: 64,
                                background: '#334155',
                                border: '1px solid ' + colors[cell].color,
                                cursor: 'pointer',
                                borderRadius: 4,
                                transition: 'border 0.2s',
                                boxShadow: selected ? '0 0 0 3px #fbbf24' : undefined,
                              }}
                              title={colors[cell].label}
                              draggable={false}
                          />
                      );
                    })
                )}
              </div>

            </div>
            <h2 className="text-center text-2xl font-semibold">Front</h2>
          </section>
          {/* Right Panel: Color Selection */}
          <section style={{marginLeft: 64}} className="flex flex-col justify-between gap-4 w-1/2">
            <div className="flex flex-col gap-2 w-full">
              <h2 className="text-2xl">Select Color</h2>
              <div className="flex flex-col gap-2" onDragOver={e => e.preventDefault()}>
                {colors.map((color, idx) => (
                    <div
                        key={idx}
                        className="flex gap-2 w-full items-center"
                        draggable
                        onDragStart={e => e.dataTransfer.setData('colorIdx', idx.toString())}
                        onDrop={e => {
                          const fromIdx = Number(e.dataTransfer.getData('colorIdx'));
                          if (fromIdx === idx) return;
                          setColors(prev => {
                            const updated = [...prev];
                            const [moved] = updated.splice(fromIdx, 1);
                            updated.splice(idx, 0, moved);
                            return updated;
                          });
                          if (selectedColor === fromIdx) {
                            setSelectedColor(idx);
                          } else if (selectedColor > fromIdx && selectedColor <= idx) {
                            setSelectedColor(selectedColor - 1);
                          } else if (selectedColor < fromIdx && selectedColor >= idx) {
                            setSelectedColor(selectedColor + 1);
                          }
                        }}
                        style={{
                          opacity: 1,
                          border: '1px dashed transparent',
                        }}
                    >
                      <button
                          key={color.color}
                          onClick={() => setSelectedColor(idx)}
                          style={{
                            width: 64,
                            height: 64,
                            background: color.color,
                            border: selectedColor === idx ? '2px solid #000' : '1px solid #d1d5db',
                            borderRadius: 4,
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                          aria-label={`Select color ${color}`}
                      />
                      <input
                          type="text"
                          value={color.label}
                          onChange={e => {
                            const newLabel = e.target.value;
                            setColors(prev =>
                                prev.map((c, cIdx) =>
                                    cIdx === idx ? {...c, label: newLabel} : c
                                )
                            );
                          }}
                          className="flex-1 px-2 py-1 border rounded"
                          aria-label={`Edit label for color ${color.color}`}
                      />
                      <button
                          onClick={() => {
                            setColors(prev => prev.filter((_, cIdx) => cIdx !== idx));
                            if (selectedColor === idx) setSelectedColor(0);
                            else if (selectedColor > idx) setSelectedColor(selectedColor - 1);
                            // Optionally, update grid cells using this color to 0
                            setGrid(prev =>
                                prev.map(row =>
                                    row.map(cell => (cell === idx ? 0 : cell > idx ? cell - 1 : cell))
                                )
                            );
                          }}
                          className=" text-white bg-red-800 hover:bg-red-900 cursor-pointer"
                          title="Delete color"
                          aria-label={`Delete color ${color.label}`}
                      >
                        Delete
                      </button>
                    </div>
                ))}
                {/* Add New Color */}
                <div className="flex gap-2 mt-4 items-center">
                  <input
                      type="color"
                      id="newColor"
                      defaultValue="#ffffff"
                      style={{width: 64, height: 64, border: 'none', padding: 0}}
                  />
                  <input
                      type="text"
                      id="newColorLabel"
                      placeholder="Label"
                      className="flex-1 px-2 py-1 border rounded"
                  />
                  <button
                      onClick={() => {
                        const colorInput = document.getElementById('newColor') as HTMLInputElement;
                        const labelInput = document.getElementById('newColorLabel') as HTMLInputElement;
                        const color = colorInput.value;
                        const label = labelInput.value.trim() || 'New Color';
                        setColors(prev => [...prev, {color, label}]);
                        colorInput.value = '#ffffff';
                        labelInput.value = '';
                      }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
            {/* Reset Button */}
            <button
                onClick={() => {
                  setSelectedColor(0);
                  setGrid(Array.from({length: 13}, () => Array(16).fill(0)));
                }}
            >
              Reset
            </button>
          </section>
        </div>
      </main>
  );
}