from dataclasses import dataclass, field


@dataclass
class CatalogItem:
    id: str
    name: str
    power_w: float
    category: str
    typical_daily_hours: float
    is_protected_default: bool = False


# Valores baseados em PROCEL/Eletrobras — consumo típico residencial brasileiro
CATALOG: list[CatalogItem] = [
    # Refrigeração e climatização
    CatalogItem("ac_7500btu",     "Ar-condicionado 7500 BTU",   750,  "cooling", 8.0),
    CatalogItem("ac_9000btu",     "Ar-condicionado 9000 BTU",   900,  "cooling", 8.0),
    CatalogItem("ac_12000btu",    "Ar-condicionado 12000 BTU",  1200, "cooling", 8.0),
    CatalogItem("ac_18000btu",    "Ar-condicionado 18000 BTU",  1800, "cooling", 8.0),
    CatalogItem("geladeira_300l", "Geladeira Frost Free 300L",  120,  "cooling", 24.0, True),
    CatalogItem("geladeira_400l", "Geladeira Frost Free 400L",  150,  "cooling", 24.0, True),
    CatalogItem("freezer_220l",   "Freezer vertical 220L",      160,  "cooling", 24.0),
    # Aquecimento
    CatalogItem("chuveiro_alta",  "Chuveiro elétrico (alta)",   5500, "heating", 0.33),
    CatalogItem("chuveiro_media", "Chuveiro elétrico (média)",  4400, "heating", 0.33),
    CatalogItem("aquecedor_2000", "Aquecedor de ambiente",      2000, "heating", 4.0),
    # Entretenimento
    CatalogItem("tv_32",          "TV LED 32\"",                60,   "entertainment", 5.0),
    CatalogItem("tv_42",          "TV LED 42\"",                80,   "entertainment", 5.0),
    CatalogItem("tv_55",          "TV LED 55\"",                100,  "entertainment", 5.0),
    CatalogItem("videogame",      "Videogame (console)",        150,  "entertainment", 3.0),
    CatalogItem("som",            "Aparelho de som",            50,   "entertainment", 3.0),
    # Eletrodomésticos
    CatalogItem("lavadora_10kg",  "Máquina de lavar 10kg",      500,  "appliance", 1.0),
    CatalogItem("lavadora_secar", "Máquina de lavar + secar",   2500, "appliance", 1.0),
    CatalogItem("ferro",          "Ferro elétrico",             1000, "appliance", 0.5),
    CatalogItem("aspirador",      "Aspirador de pó",            1200, "appliance", 0.5),
    CatalogItem("lavadoucas",     "Lava-louças",                1200, "appliance", 1.0),
    # Cozinha
    CatalogItem("microondas",     "Microondas",                 1200, "cooking", 0.25),
    CatalogItem("forno_eletrico", "Forno elétrico",             2000, "cooking", 0.5),
    CatalogItem("cafeteira",      "Cafeteira elétrica",         600,  "cooking", 0.25),
    CatalogItem("liquidificador", "Liquidificador",             350,  "cooking", 0.17),
    CatalogItem("panela_pressao", "Panela elétrica de pressão", 1000, "cooking", 0.5),
    # Eletrônicos
    CatalogItem("computador",     "Computador desktop",         200,  "electronics", 8.0),
    CatalogItem("notebook",       "Notebook",                   65,   "electronics", 8.0),
    CatalogItem("impressora",     "Impressora",                 15,   "electronics", 0.5),
    CatalogItem("roteador",       "Roteador Wi-Fi",             10,   "electronics", 24.0),
    # Iluminação e ventilação
    CatalogItem("lampada_9w",     "Lâmpada LED 9W",             9,    "lighting", 6.0),
    CatalogItem("lampada_15w",    "Lâmpada LED 15W",            15,   "lighting", 6.0),
    CatalogItem("ventilador_teto","Ventilador de teto",         80,   "lighting", 8.0),
    CatalogItem("ventilador_mesa","Ventilador de mesa",         60,   "lighting", 8.0),
    # Outros
    CatalogItem("bomba_agua",     "Bomba d'água",               750,  "other", 2.0),
    CatalogItem("portao",         "Portão eletrônico",          200,  "other", 0.1),
]
