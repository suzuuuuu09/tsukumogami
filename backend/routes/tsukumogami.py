from typing import Annotated, List, NotRequired, TypedDict

from flask import Blueprint


class Tsukumogami(TypedDict):
    """付喪神の情報を表す型定義"""

    id: Annotated[str, "付喪神のID"]
    name: Annotated[str, "付喪神の名前"]
    image: Annotated[str, "付喪神の画像URLまたはパス"]
    has: NotRequired[Annotated[bool, "ユーザーがこの付喪神を持っているかどうか"]]


tsukumogami_bp = Blueprint("tsukumogami", __name__)
tsukumogami_list: List[Tsukumogami] = [
    {"id": "bakeneko", "name": "化け猫", "image": "bakeneko.png", "has": False},
    {"id": "chouchin", "name": "提灯", "image": "chouchin.png", "has": False},
    {"id": "daruma_red", "name": "赤だるま", "image": "daruma_red.png", "has": False},
    {"id": "jizou", "name": "地蔵", "image": "jizou.png", "has": False},
    {"id": "kappa", "name": "河童", "image": "kappa.png", "has": False},
    {"id": "kasa", "name": "傘", "image": "kasa_yokai.png", "has": False},
    {"id": "kasajizou", "name": "傘地蔵", "image": "kasajizou.png", "has": False},
    {"id": "kitsune", "name": "狐", "image": "kitsune.png", "has": False},
    {"id": "komainu", "name": "狛犬", "image": "komainu.png", "has": False},
    {"id": "manekineko", "name": "招き猫", "image": "manekineko.png", "has": False},
    {"id": "omen_okame", "name": "お面おかめ", "image": "omen_okame.png", "has": False},
    {"id": "oni", "name": "鬼", "image": "oni.png", "has": False},
    {"id": "shishimai", "name": "獅子舞", "image": "shishimai.png", "has": False},
    {"id": "tako", "name": "凧", "image": "tako.png", "has": False},
    {"id": "tanuki", "name": "たぬき", "image": "tanuki.png", "has": False},
    {"id": "tsuru", "name": "鶴", "image": "tsuru.png", "has": False},
    {"id": "yukionna", "name": "雪女", "image": "yuki_onnna.png", "has": False},
    {
        "id": "zashiki_warashi",
        "name": "座敷童子",
        "image": "zashiki_warashi.png",
        "has": False,
    },
]


@tsukumogami_bp.route("/tsukumogami", methods=["GET"])
def get_tsukumogami():
    """付喪神のリストを返すエンドポイント"""
    return {"tsukumogami": tsukumogami_list}


@tsukumogami_bp.route("/tsukumogami/<string:tsukumogami_id>", methods=["POST"])
def update_tsukumogami_has(tsukumogami_id: str):
    """指定されたIDの付喪神の所有状態を更新するエンドポイント

    Args:
        tsukumogami_id: 更新する付喪神のID

    Returns:
        更新された付喪神の情報を含むJSONレスポンス
    """
    for tsukumogami in tsukumogami_list:
        if tsukumogami["id"] == tsukumogami_id:
            tsukumogami["has"] = not tsukumogami.get("has", False)
            return {"tsukumogami": tsukumogami}
    return {"error": "付喪神が見つかりませんでした"}, 404
