class Mulberry32:
    def __init__(self, seed: int):
        self.s = seed & 0xFFFFFFFF

    def next_uint32(self) -> int:
        self.s = (self.s + 0x6D2B79F5) & 0xFFFFFFFF
        t = self.s
        m1 = (t ^ (t >> 15)) & 0xFFFFFFFF
        m2 = t | 61
        t = (m1 * m2) & 0xFFFFFFFF
        t = (t ^ (t + (((t ^ (t >> 7)) * 61) & 0xFFFFFFFF))) & 0xFFFFFFFF
        return (t ^ (t >> 14)) & 0xFFFFFFFF

    def next_int(self, max_exclusive: int) -> int:
        if max_exclusive <= 0:
            raise ValueError("max_exclusive must be positive")
        limit = (0x100000000 // max_exclusive) * max_exclusive
        while True:
            value = self.next_uint32()
            if value < limit:
                return value % max_exclusive
