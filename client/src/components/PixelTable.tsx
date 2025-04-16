import React from 'react';
import '../styling/PixelTable.css';

interface PixelTableProps {
	columns: string[];
	data: string[][];
}

const PixelTable: React.FC<PixelTableProps> = ({ columns, data }) => {
	return (
		<table className="pixelated pixel-table">
			<thead>
				<tr>
					{columns.map((col, idx) => (
						<th key={idx}>{col}</th>
					))}
				</tr>
			</thead>
			<tbody>
				{data.map((row, rowIdx) => (
					<tr key={rowIdx}>
						{row.map((cell, colIdx) => (
							<td key={colIdx}>{cell}</td>
						))}
					</tr>
				))}
			</tbody>
		</table>
	);
};

export default PixelTable;
