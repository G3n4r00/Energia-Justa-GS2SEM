import json
import os
from pathlib import Path

_PROMPT_FILE = Path(__file__).parent / "prompts" / "plan_explanation_v1.md"
_MODEL = "gemini-2.0-flash"


def explain_plan(plan_dict: dict) -> str:
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        return _fallback(plan_dict)
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        system_prompt = _PROMPT_FILE.read_text(encoding="utf-8") if _PROMPT_FILE.exists() else ""
        user_msg = f"Plano de economia:\n{json.dumps(plan_dict, ensure_ascii=False, indent=2)}"
        model = genai.GenerativeModel(_MODEL, system_instruction=system_prompt)
        response = model.generate_content(user_msg)
        return response.text
    except Exception:
        return _fallback(plan_dict)


def _fallback(p: dict) -> str:
    status = "atingível" if p.get("status") == "reached" else "não atingível apenas com os aparelhos cadastrados"
    items = p.get("items", [])
    dica = (
        f"Reduzir o uso do {items[0]['appliance_name']} é o passo com maior impacto."
        if items else "Seu consumo já está dentro da meta."
    )
    return (
        f"Seu plano analisou {len(items)} aparelho(s). "
        f"O consumo atual é R$ {p['current_brl']:.2f} e o projetado é R$ {p['projected_brl']:.2f}, "
        f"gerando uma economia de R$ {p['savings_brl']:.2f} no ciclo. "
        f"A meta é {status}. {dica}"
    )
