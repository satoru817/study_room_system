<?php defined('SYSPATH') or die('No direct script access');

final class Elf_Stream implements IteratorAggregate{
    private array $items;

    public function __construct(array $items)
    {
        $this->items = $items;
    }

    public function map(callable $callback): self
    {
        return new self(array_map($callback, $this->items));
    }

    public function filter(callable $callback): self
    {
        return new self(array_filter($this->items, $callback));
    }

    public function reduce(callable $callback, $initial = null)
    {
        return array_reduce($this->items, $callback, $initial);
    }

    public function sort(callable $callback): self
    {
        $sorted = $this->items;
        usort($sorted, $callback);
        return new self($sorted);
    }

    public function first()
    {
        return reset($this->items);
    }

    public function toArray(): array
    {
        return $this->items;
    }

    public function getIterator(): Traversable
    {
        return new ArrayIterator($this->items);
    }

    public static function of(array $items): self
    {
        return new self($items);
    }
}