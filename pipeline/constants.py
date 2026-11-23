"""
constants.py - Advanced Bridge Technique Bitmasks and Definitions
"""

# Technique Bitmask Constants (uint16)
TECH_SQUEEZE = 1 << 0             # 1: Simple, Double, or Strip Squeeze
TECH_ENDPLAY = 1 << 1             # 2: Elimination & Throw-in / Forced Return
TECH_TRUMP_COUP = 1 << 2          # 4: Grand Coup, Devil's Coup, Coup En Passant, Smother Play
TECH_UNBLOCK_COUP = 1 << 3        # 8: Vienna Coup, Anti-Bath Coup
TECH_COMMUNICATION_COUP = 1 << 4  # 16: Scissors Coup, Merrimac Coup, Deschapelles Coup, Holdup
TECH_CHOICE_COUP = 1 << 5         # 32: Morton's Fork Coup, Crocodile Coup, Avoidance Play, Alcatraz Coup
TECH_INTRA_FINESSE = 1 << 6       # 64: Intra-Finesse / Double Pinning

TECHNIQUE_NAMES_DA = {
    TECH_SQUEEZE: "Squeeze (Simpel/Dobbelt/Strip)",
    TECH_ENDPLAY: "Slutspil / Indspil (Elimination & Throw-in)",
    TECH_TRUMP_COUP: "Trumfkup (Grand Coup / Coup En Passant)",
    TECH_UNBLOCK_COUP: "Afblokeringskup (Vienna Coup / Anti-Bath)",
    TECH_COMMUNICATION_COUP: "Kommunikationskup (Scissors / Merrimac)",
    TECH_CHOICE_COUP: "Valgkup (Morton's Fork / Krokodillekup)",
    TECH_INTRA_FINESSE: "Intra-Knibning (Double Pinning)",
}

TECHNIQUE_LABELS = {
    TECH_SQUEEZE: "Squeeze",
    TECH_ENDPLAY: "Endplay",
    TECH_TRUMP_COUP: "Trump Coup",
    TECH_UNBLOCK_COUP: "Vienna/Anti-Bath Coup",
    TECH_COMMUNICATION_COUP: "Communication Coup",
    TECH_CHOICE_COUP: "Morton's Fork/Choice Coup",
    TECH_INTRA_FINESSE: "Intra-Finesse",
}
