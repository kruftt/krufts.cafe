import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
} from "@components/ui/pagination";
import { useEffect, useState } from "react";


interface Props extends React.ComponentProps<'div'> {
	perPage: number,
	total: number,
	select: (n: number) => void,
	selected: number,
}

export function ListPagination({
	className,
	perPage,
	total,
	select,
	selected,
}: Props) {
	const max = Math.ceil(total / perPage);
	const [value, setValue] = useState(selected.toString());
	
	useEffect(() => {
		setValue(selected.toString());
	}, [selected]);

	function onChange(e: React.ChangeEvent<HTMLInputElement>) {
		setValue(e.currentTarget.value);	
	}

	function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
	  if (e.key === "Enter") {
			let val = parseInt(e.currentTarget.value, 10);

			if (Number.isNaN(val)) {
				setValue(selected.toString());
				return;
			}

			val = Math.min(max, Math.max(1, val));
			select(val);
		}
	}

	return (
		<Pagination className={className}>
			<PaginationContent>
				<PaginationItem>
						<Button onClick={() => select(1)}>{`|<`}</Button>
					</PaginationItem>
				<PaginationItem>
					<Button
						disabled={selected === 1}
						onClick={() => select(selected - 1)}
					>
						{"<"}
					</Button>
				</PaginationItem>
				<PaginationItem>
					<Input
						className="field-sizing-content"
						type="number"
						min={1}
						max={max}
						value={value}
						onChange={onChange}
						onKeyDown={onKeyDown}
					/>
				</PaginationItem>
				<PaginationItem>
					<Button
						disabled={selected === max}
						onClick={() => select(selected + 1)}
					>
						{">"}
					</Button>
				</PaginationItem>
				<PaginationItem>
						<Button onClick={() => select(max)}>{`>|`}</Button>
					</PaginationItem>
			</PaginationContent>
		</Pagination>
	);
}