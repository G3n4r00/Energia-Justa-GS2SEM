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
    CatalogItem("ac_7500btu",       "Ar-condicionado 7500 BTU",        750,  "cooling", 8.0),
    CatalogItem("ac_9000btu",       "Ar-condicionado 9000 BTU",        900,  "cooling", 8.0),
    CatalogItem("ac_12000btu",      "Ar-condicionado 12000 BTU",       1200, "cooling", 8.0),
    CatalogItem("ac_18000btu",      "Ar-condicionado 18000 BTU",       1800, "cooling", 8.0),
    CatalogItem("ac_24000btu",      "Ar-condicionado 24000 BTU",       2400, "cooling", 8.0),
    CatalogItem("geladeira_200l",   "Geladeira compacta até 200L",     80,   "cooling", 24.0, True),
    CatalogItem("geladeira_300l",   "Geladeira Frost Free 260–300L",   120,  "cooling", 24.0, True),
    CatalogItem("geladeira_400l",   "Geladeira Frost Free 350–400L",   150,  "cooling", 24.0, True),
    CatalogItem("geladeira_500l",   "Geladeira Frost Free 450–500L",   180,  "cooling", 24.0, True),
    CatalogItem("freezer_vert",     "Freezer vertical 220–300L",       160,  "cooling", 24.0),
    CatalogItem("freezer_horiz",    "Freezer horizontal 300–500L",     200,  "cooling", 24.0),
    # Aquecimento
    CatalogItem("chuveiro_econom",  "Chuveiro elétrico (econômico)",   3300, "heating", 0.33),
    CatalogItem("chuveiro_media",   "Chuveiro elétrico (média)",       4400, "heating", 0.33),
    CatalogItem("chuveiro_alta",    "Chuveiro elétrico (alta)",        5500, "heating", 0.33),
    CatalogItem("torneira_eletrica","Torneira elétrica",               3000, "heating", 0.5),
    CatalogItem("aquecedor_1500",   "Aquecedor de ambiente 1500W",     1500, "heating", 4.0),
    CatalogItem("aquecedor_2000",   "Aquecedor de ambiente 2000W",     2000, "heating", 4.0),
    # Entretenimento
    CatalogItem("tv_32",            "TV LED 32\"",                     60,   "entertainment", 5.0),
    CatalogItem("tv_43",            "TV LED 43\"",                     85,   "entertainment", 5.0),
    CatalogItem("tv_50",            "TV LED 50\"",                     100,  "entertainment", 5.0),
    CatalogItem("tv_55",            "TV LED 55\"",                     110,  "entertainment", 5.0),
    CatalogItem("tv_65",            "TV LED 65\"",                     150,  "entertainment", 5.0),
    CatalogItem("videogame",        "Videogame (console)",             150,  "entertainment", 3.0),
    CatalogItem("som",              "Aparelho de som / caixa Bluetooth",50,  "entertainment", 3.0),
    # Eletrodomésticos
    CatalogItem("lavadora_6kg",     "Máquina de lavar 6–8kg",          380,  "appliance", 1.0),
    CatalogItem("lavadora_10kg",    "Máquina de lavar 10–12kg",        500,  "appliance", 1.0),
    CatalogItem("lavadora_15kg",    "Máquina de lavar 15kg",           600,  "appliance", 1.0),
    CatalogItem("lavadora_secar",   "Máquina de lavar + secar",        2500, "appliance", 1.0),
    CatalogItem("secadora_9kg",     "Secadora de roupa 9–11kg",        1500, "appliance", 0.75),
    CatalogItem("ferro",            "Ferro elétrico",                  1000, "appliance", 0.5),
    CatalogItem("aspirador",        "Aspirador de pó",                 1200, "appliance", 0.5),
    CatalogItem("lavadoucas",       "Lava-louças",                     1200, "appliance", 1.0),
    # Cozinha
    CatalogItem("microondas_700w",  "Microondas 700W",                 700,  "cooking", 0.25),
    CatalogItem("microondas_1200w", "Microondas 1200W",                1200, "cooking", 0.25),
    CatalogItem("microondas_1400w", "Microondas 1400W",                1400, "cooking", 0.25),
    CatalogItem("forno_eletrico",   "Forno elétrico de embutir",       2000, "cooking", 0.5),
    CatalogItem("fogao_inducao",    "Fogão de indução (1 boca)",       2000, "cooking", 0.75),
    CatalogItem("airfryer",         "Fritadeira elétrica (Air Fryer)", 1500, "cooking", 0.5),
    CatalogItem("chaleira",         "Chaleira elétrica",               1200, "cooking", 0.1),
    CatalogItem("cafeteira",        "Cafeteira coador/expresso",       600,  "cooking", 0.25),
    CatalogItem("cafeteira_capsula","Cafeteira de cápsula",            1300, "cooking", 0.1),
    CatalogItem("liquidificador",   "Liquidificador",                  350,  "cooking", 0.17),
    CatalogItem("batedeira",        "Batedeira",                       400,  "cooking", 0.25),
    CatalogItem("panela_pressao",   "Panela elétrica de pressão",      1000, "cooking", 0.5),
    CatalogItem("sanduicheira",     "Sanduicheira / grill elétrico",   750,  "cooking", 0.25),
    # Eletrônicos
    CatalogItem("computador",       "Computador desktop",              200,  "electronics", 8.0),
    CatalogItem("monitor_24",       "Monitor 24\"",                    25,   "electronics", 8.0),
    CatalogItem("monitor_27",       "Monitor 27\"",                    35,   "electronics", 8.0),
    CatalogItem("notebook",         "Notebook / laptop",               65,   "electronics", 8.0),
    CatalogItem("celular",          "Carregador de celular",           15,   "electronics", 2.0),
    CatalogItem("impressora",       "Impressora",                      15,   "electronics", 0.5),
    CatalogItem("roteador",         "Roteador Wi-Fi",                  10,   "electronics", 24.0),
    # Iluminação e ventilação
    CatalogItem("lampada_6w",       "Lâmpada LED 6W",                  6,    "lighting", 6.0),
    CatalogItem("lampada_9w",       "Lâmpada LED 9W",                  9,    "lighting", 6.0),
    CatalogItem("lampada_15w",      "Lâmpada LED 15W",                 15,   "lighting", 6.0),
    CatalogItem("ventilador_teto",  "Ventilador de teto",              80,   "lighting", 8.0),
    CatalogItem("ventilador_mesa",  "Ventilador de mesa",              60,   "lighting", 8.0),
    CatalogItem("ventilador_torre", "Ventilador de torre",             45,   "lighting", 8.0),
    # Outros
    CatalogItem("bomba_agua",       "Bomba d'água / pressurizadora",   750,  "other", 2.0),
    CatalogItem("portao",           "Portão eletrônico",               200,  "other", 0.1),
    CatalogItem("alarme",           "Central de alarme",               15,   "other", 24.0),
]
