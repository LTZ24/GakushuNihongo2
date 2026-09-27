"""Seed 50 chapter entries; full Minna no Nihongo 1 Bab 1 content as PoC.
Run: cd /app/backend && python seed.py  (idempotent — safe to re-run)
"""

import asyncio
import re

from lib.db import db, ensure_indexes

BOOK_LABELS = {1: "Minna no Nihongo 1", 2: "Minna no Nihongo 2"}

_KANJI_RE = re.compile(r"[\u4e00-\u9fff]")


def seg(text: str, reading: str | None = None) -> dict:
    # Furigana only makes sense above kanji — drop redundant readings on pure-kana/latin text.
    if reading and not _KANJI_RE.search(text):
        reading = None
    return {"text": text, "reading": reading}


def ex(segments: list[dict], translation: str) -> dict:
    return {"segments": segments, "translation": translation}


def _locked_doc(number: int) -> dict:
    book = 1 if number <= 25 else 2
    return {
        "number": number,
        "book": book,
        "title": f"第{number}課",
        "title_translation": f"Materi Bab {number} — segera tersedia",
        "has_content": False,
        "content": None,
    }


BAB1_CONTENT: dict = {
    "bunpo": [
        {
            "id": "b1",
            "judul": "N1 は N2 です — Kalimat Pernyataan Dasar",
            "rumus": "[Kata Benda 1] は [Kata Benda 2] です",
            "keterangan": [
                "[Kata Benda 1] = topik yang sedang dibicarakan",
                "は = [Partikel Topik], dibaca “wa” (bukan “ha”)",
                "です = kata bantu “adalah” (bentuk sopan, -desu)",
            ],
            "penjelasan": (
                "Ini pola kalimat paling dasar dalam Bahasa Jepang. Partikel は ditempelkan setelah "
                "kata benda untuk menandai bahwa itulah topik kalimat, lalu です menutup kalimat sebagai "
                "bentuk sopan dari “adalah”. Bahasa Jepang tidak mengenal artikel (a/the) dan tidak "
                "mengubah bentuk kata benda, sehingga pola ini berlaku untuk semua kata benda. Contoh: "
                "わたしは マイク・ミラーです。 berarti “Saya (adalah) Mike Miller.” Perhatikan juga bahwa "
                "partikel は dibaca “wa” meski ditulis dengan kana “ha”."
            ),
            "contoh": [
                ex([seg("わたし", "わたし"), seg("は"), seg("マイク・ミラー"), seg("です。")], "Saya Mike Miller."),
                ex([seg("ミラーさん"), seg("は"), seg("会社員", "かいしゃいん"), seg("です。")], "Pak Miller adalah pegawai perusahaan."),
                ex([seg("田中先生", "たなかせんせい"), seg("は"), seg("日本語", "にほんご"), seg("の"), seg("先生", "せんせい"), seg("です。")], "Pak Tanaka adalah guru bahasa Jepang."),
            ],
        },
        {
            "id": "b2",
            "judul": "N1 は N2 じゃありません — Kalimat Negatif",
            "rumus": "[Kata Benda 1] は [Kata Benda 2] じゃありません",
            "keterangan": [
                "じゃありません = bentuk negatif sopan dari です (“bukan”)",
                "bentuk lebih formal: では ありません",
                "[Kata Benda 2] = hal yang ditekan (dinegasikan)",
            ],
            "penjelasan": (
                "Untuk membuat kalimat negatif, です diganti menjadi じゃありません yang berarti “bukan”. "
                "Pada situasi formal (misal wawancara atau surat resmi), digunakan では ありません — artinya "
                "sama persis, hanya tingkat formalitasnya lebih tinggi. Struktur kalimatnya tetap sama: "
                "topik + は + kata benda + じゃありません."
            ),
            "contoh": [
                ex([seg("サントスさん"), seg("は"), seg("学生", "がくせい"), seg("じゃありません。")], "Pak Santos bukan mahasiswa."),
                ex([seg("わたし", "わたし"), seg("は"), seg("先生", "せんせい"), seg("じゃありません。")], "Saya bukan guru."),
            ],
        },
        {
            "id": "b3",
            "judul": "N1 は N2 ですか — Kalimat Tanya (Partikel か)",
            "rumus": "[Kata Benda 1] は [Kata Benda 2] ですか",
            "keterangan": [
                "か = [Partikel Tanya] yang diletakkan di akhir kalimat",
                "kalimat tertulis tidak memakai tanda tanya “?”",
                "jawabannya: はい (ya) / いいえ (tidak)",
            ],
            "penjelasan": (
                "Kalimat tanya paling sederhana dibentuk dengan menambahkan partikel か di akhir kalimat "
                "pernyataan — tanpa mengubah urutan kata. Tanda tanya tidak digunakan dalam tulisan standar; "
                "kalimat cukup diakhiri 。 Jawaban singkat yang umum: はい、そうです。 (“Ya, benar.”) atau "
                "mengulang pola negatif: いいえ、学生じゃありません。"
            ),
            "contoh": [
                ex([seg("あなた"), seg("は"), seg("学生", "がくせい"), seg("です"), seg("か。")], "Apakah Anda mahasiswa? — Ya, benar."),
                ex([seg("サントスさん"), seg("は"), seg("研修生", "けんしゅうせい"), seg("です"), seg("か。")], "Apakah Pak Santos peserta pelatihan? — Tidak, bukan."),
            ],
        },
        {
            "id": "b4",
            "judul": "Kata Tanya だれ — Tetap di Posisi Jawaban",
            "rumus": "[Kata Benda] は [Kata Tanya: だれ] ですか",
            "keterangan": [
                "だれ = [Kata Tanya] “siapa”",
                "kata tanya TIDAK dipindah ke awal kalimat",
                "bentuk sopan dari だれ adalah どなた",
            ],
            "penjelasan": (
                "Berbeda dengan Bahasa Inggris (who is that?) atau Bahasa Indonesia yang cenderung menarik "
                "kata tanya ke depan, kata tanya Bahasa Jepang tetap berada di posisi jawabannya — di sini "
                "setelah partikel は. Jadi あの 方は だれですか secara harfiah “orang itu adalah siapa?”. "
                "Jika ingin lebih sopan (misal menanya orang di luar keluarga/teman dekat), gunakan どなた."
            ),
            "contoh": [
                ex([seg("あの 方", "あの かた"), seg("は"), seg("だれ"), seg("です"), seg("か。")], "Siapa orang itu?"),
                ex([seg("あの 方", "あの かた"), seg("は"), seg("田中先生", "たなかせんせい"), seg("です。")], "Orang itu (beliau) Pak Tanaka."),
            ],
        },
        {
            "id": "b5",
            "judul": "Partikel も — “Juga”",
            "rumus": "[Kata Benda 1] も [Kata Benda 2] です",
            "keterangan": [
                "も = [Partikel] “juga”",
                "も MENGGANTIKAN は — keduanya tidak dipakai bersamaan",
                "pada kalimat negatif, maknanya “juga tidak”",
            ],
            "penjelasan": (
                "Partikel も dipakai saat topik kedua mengalami hal yang sama dengan topik pertama. Posisinya "
                "tepat di tempat は berada, jadi は tidak ditulis lagi. Jika kalimat pertamanya negatif dan "
                "kalimat kedua juga negatif, cukup ulangi pola: わたしは 学生じゃありません。サントスさんも "
                "学生じゃありません。 (“Saya bukan mahasiswa. Pak Santos juga bukan.”)"
            ),
            "contoh": [
                ex([seg("サントスさん"), seg("も"), seg("会社員", "かいしゃいん"), seg("です。")], "Pak Santos juga pegawai perusahaan."),
                ex([seg("ワットさん"), seg("も"), seg("学生", "がくせい"), seg("じゃありません。")], "Pak Watt juga bukan mahasiswa."),
            ],
        },
        {
            "id": "b6",
            "judul": "Partikel の — Kepemilikan & Koneksi Kata Benda",
            "rumus": "[Kata Benda 1] の [Kata Benda 2]",
            "keterangan": [
                "の = [Partikel] penghubung “milik / dari”",
                "[Kata Benda 1] = pemilik atau asal",
                "urutannya KEBALIKAN dari Bahasa Indonesia: 私の車 = “mobil saya”",
            ],
            "penjelasan": (
                "Pola N1 の N2 menghubungkan dua kata benda: N2 milik atau termasuk kategori N1. Contoh "
                "わたしの 車 berarti “mobil saya” — perhatikan urutannya kebalikan dari Bahasa Indonesia. "
                "Pola ini juga dipakai untuk kategori, bukan hanya milik: 日本語の 先生 = “guru bahasa Jepang” "
                "(guru yang mengajar bahasa Jepang, bukan guru milik bahasa Jepang)."
            ),
            "contoh": [
                ex([seg("わたし", "わたし"), seg("の"), seg("車", "くるま"), seg("です。")], "Itu mobil saya."),
                ex([seg("田中先生", "たなかせんせい"), seg("は"), seg("日本語", "にほんご"), seg("の"), seg("先生", "せんせい"), seg("です。")], "Pak Tanaka adalah guru bahasa Jepang."),
                ex([seg("サントスさん"), seg("は"), seg("わたし", "わたし"), seg("の"), seg("友達", "ともだち"), seg("です。")], "Pak Santos adalah teman saya."),
            ],
        },
        {
            "id": "b7",
            "judul": "Sapaan & Akhiran Nama — さん・ちゃん・くん・先生",
            "rumus": "[Nama] + さん / ちゃん / くん / 先生",
            "keterangan": [
                "~さん = akhiran hormat netral (untuk pria maupun wanita)",
                "~ちゃん = akhiran akrab (anak perempuan, teman dekat)",
                "~くん = akhiran akrab (anak laki-laki, junior di kantor)",
                "~先生 = untuk guru, dokter, pengacara — JANGAN untuk diri sendiri",
            ],
            "penjelasan": (
                "Dalam bahasa Jepang, nama orang SELALU diberi akhiran saat memanggil atau membicarakannya; "
                "memanggil dengan nama telanjang dianggap kasar. Gunakan さん sebagai pilihan aman. Saat baru "
                "bertemu, ucapkan はじめまして (“perkenalkan”), lalu ditutup どうぞ よろしく お願いします. "
                "Untuk memperkenalkan orang ketiga, gunakan pola こちらは ~ です (“ini adalah ~”)."
            ),
            "contoh": [
                ex([seg("はじめまして。"), seg("どうぞ よろしく お願いします。")], "Perkenalkan, mohon bantuannya."),
                ex([seg("こちらは"), seg("マリー・シュミットさん"), seg("です。")], "Ini adalah Nona Marie Schmidt."),
            ],
        },
    ],
    "kotoba": [
        {
            "id": "k01", "word": "わたし", "kana": "わたし", "romaji": "watashi", "meaning": "saya", "word_type": "Kata Benda",
            "segments": [seg("わたし", "わたし")],
            "example": ex([seg("わたし", "わたし"), seg("は"), seg("マイク・ミラー"), seg("です。")], "Saya Mike Miller."),
        },
        {
            "id": "k02", "word": "あなた", "kana": "あなた", "romaji": "anata", "meaning": "kamu; Anda", "word_type": "Kata Benda",
            "segments": [seg("あなた", "あなた")],
            "example": ex([seg("あなた"), seg("は"), seg("学生", "がくせい"), seg("です"), seg("か。")], "Apakah Anda mahasiswa?"),
        },
        {
            "id": "k03", "word": "~さん", "kana": "さん", "romaji": "-san", "meaning": "saudara; Pak; Bu (akhiran hormat)", "word_type": "Akhiran",
            "segments": [seg("さん", "さん")],
            "example": ex([seg("ミラーさん"), seg("は"), seg("会社員", "かいしゃいん"), seg("です。")], "Pak Miller pegawai perusahaan."),
        },
        {
            "id": "k04", "word": "~ちゃん", "kana": "ちゃん", "romaji": "-chan", "meaning": "akhiran akrab untuk anak perempuan / teman dekat", "word_type": "Akhiran",
            "segments": [seg("ちゃん", "ちゃん")],
            "example": ex([seg("カリナちゃん"), seg("は"), seg("学生", "がくせい"), seg("です。")], "Karina-chan mahasiswa."),
        },
        {
            "id": "k05", "word": "~くん", "kana": "くん", "romaji": "-kun", "meaning": "akhiran akrab untuk anak laki-laki / junior", "word_type": "Akhiran",
            "segments": [seg("くん", "くん")],
            "example": ex([seg("山田くん", "やまだくん"), seg("は"), seg("研修生", "けんしゅうせい"), seg("です。")], "Yamada-kun peserta pelatihan."),
        },
        {
            "id": "k06", "word": "はじめまして", "kana": "はじめまして", "romaji": "hajimemashite", "meaning": "salam perkenalan (baru pertama bertemu)", "word_type": "Ungkapan",
            "segments": [seg("はじめまして", "はじめまして")],
            "example": ex([seg("はじめまして。"), seg("マイク・ミラー"), seg("です。")], "Perkenalkan, saya Mike Miller."),
        },
        {
            "id": "k07", "word": "どうぞ よろしく（お願いします）", "kana": "どうぞ よろしく（おねがいします）", "romaji": "dōzo yoroshiku (onegai shimasu)", "meaning": "salam perkenalan — mohon bantuannya", "word_type": "Ungkapan",
            "segments": [seg("どうぞ よろしく"), seg("（お願いします）", "（おねがいします）")],
            "example": ex([seg("どうぞ よろしく お願いします。")], "Salam kenal — mohon bantuannya."),
        },
        {
            "id": "k08", "word": "こちらは ~", "kana": "こちらは", "romaji": "kochira wa", "meaning": "ini adalah ~ (memperkenalkan orang)", "word_type": "Ungkapan",
            "segments": [seg("こちらは", "こちらは")],
            "example": ex([seg("こちらは"), seg("マリー・シュミットさん"), seg("です。")], "Ini adalah Nona Marie Schmidt."),
        },
        {
            "id": "k09", "word": "~から きました", "kana": "から きました", "romaji": "-kara kimashita", "meaning": "datang dari ~", "word_type": "Ungkapan",
            "segments": [seg("から", "から"), seg("きました", "きました")],
            "example": ex([seg("ブラジル"), seg("から", "から"), seg("きました", "きました"), seg("。")], "Saya datang dari Brasil."),
        },
        {
            "id": "k10", "word": "アメリカ", "kana": "アメリカ", "romaji": "Amerika", "meaning": "Amerika (negara)", "word_type": "Kata Benda",
            "segments": [seg("アメリカ", "アメリカ")],
            "example": ex([seg("ミラーさん"), seg("は"), seg("アメリカ"), seg("から", "から"), seg("きました", "きました"), seg("。")], "Pak Miller datang dari Amerika."),
        },
        {
            "id": "k11", "word": "インドネシア", "kana": "インドネシア", "romaji": "Indoneshia", "meaning": "Indonesia (negara)", "word_type": "Kata Benda",
            "segments": [seg("インドネシア", "インドネシア")],
            "example": ex([seg("わたし", "わたし"), seg("は"), seg("インドネシア"), seg("から", "から"), seg("きました", "きました"), seg("。")], "Saya datang dari Indonesia."),
        },
        {
            "id": "k12", "word": "ブラジル", "kana": "ブラジル", "romaji": "Burajiru", "meaning": "Brasil (negara)", "word_type": "Kata Benda",
            "segments": [seg("ブラジル", "ブラジル")],
            "example": ex([seg("サントスさん"), seg("は"), seg("ブラジル"), seg("から", "から"), seg("きました", "きました"), seg("。")], "Pak Santos datang dari Brasil."),
        },
        {
            "id": "k13", "word": "ドイツ", "kana": "ドイツ", "romaji": "Doitsu", "meaning": "Jerman (negara)", "word_type": "Kata Benda",
            "segments": [seg("ドイツ", "ドイツ")],
            "example": ex([seg("シュミットさん"), seg("は"), seg("ドイツ"), seg("から", "から"), seg("きました", "きました"), seg("。")], "Nona Schmidt datang dari Jerman."),
        },
        {
            "id": "k14", "word": "イギリス", "kana": "イギリス", "romaji": "Igirisu", "meaning": "Inggris (negara)", "word_type": "Kata Benda",
            "segments": [seg("イギリス", "イギリス")],
            "example": ex([seg("わたし", "わたし"), seg("の"), seg("友達", "ともだち"), seg("は"), seg("イギリス"), seg("から", "から"), seg("きました", "きました"), seg("。")], "Teman saya datang dari Inggris."),
        },
        {
            "id": "k15", "word": "会社員", "kana": "かいしゃいん", "romaji": "kaishain", "meaning": "pegawai perusahaan", "word_type": "Kata Benda",
            "segments": [seg("会社員", "かいしゃいん")],
            "example": ex([seg("ミラーさん"), seg("は"), seg("会社員", "かいしゃいん"), seg("です。")], "Pak Miller pegawai perusahaan."),
        },
        {
            "id": "k16", "word": "学生", "kana": "がくせい", "romaji": "gakusei", "meaning": "mahasiswa; pelajar", "word_type": "Kata Benda",
            "segments": [seg("学生", "がくせい")],
            "example": ex([seg("サントスさん"), seg("は"), seg("学生", "がくせい"), seg("じゃありません。")], "Pak Santos bukan mahasiswa."),
        },
        {
            "id": "k17", "word": "先生", "kana": "せんせい", "romaji": "sensei", "meaning": "guru; pengajar", "word_type": "Kata Benda",
            "segments": [seg("先生", "せんせい")],
            "example": ex([seg("田中先生", "たなかせんせい"), seg("は"), seg("日本語", "にほんご"), seg("の"), seg("先生", "せんせい"), seg("です。")], "Pak Tanaka guru bahasa Jepang."),
        },
        {
            "id": "k18", "word": "教師", "kana": "きょうし", "romaji": "kyōshi", "meaning": "guru (sebutan profesi, bukan panggilan)", "word_type": "Kata Benda",
            "segments": [seg("教師", "きょうし")],
            "example": ex([seg("わたし", "わたし"), seg("の"), seg("友達", "ともだち"), seg("は"), seg("教師", "きょうし"), seg("です。")], "Teman saya adalah guru."),
        },
        {
            "id": "k19", "word": "研修生", "kana": "けんしゅうせい", "romaji": "kenshūsei", "meaning": "peserta program pelatihan", "word_type": "Kata Benda",
            "segments": [seg("研修生", "けんしゅうせい")],
            "example": ex([seg("サントスさん"), seg("は"), seg("研修生", "けんしゅうせい"), seg("です"), seg("か。")], "Apakah Pak Santos peserta pelatihan?"),
        },
        {
            "id": "k20", "word": "デザイナー", "kana": "デザイナー", "romaji": "dezainā", "meaning": "desainer", "word_type": "Kata Benda",
            "segments": [seg("デザイナー", "デザイナー")],
            "example": ex([seg("シュミットさん"), seg("は"), seg("デザイナー"), seg("です。")], "Nona Schmidt desainer."),
        },
        {
            "id": "k21", "word": "だれ", "kana": "だれ", "romaji": "dare", "meaning": "siapa", "word_type": "Kata Tanya",
            "segments": [seg("だれ", "だれ")],
            "example": ex([seg("あの 方", "あの かた"), seg("は"), seg("だれ", "だれ"), seg("です"), seg("か。")], "Siapa orang itu?"),
        },
        {
            "id": "k22", "word": "あの方", "kana": "あのかた", "romaji": "anokata", "meaning": "orang itu (bentuk sopan)", "word_type": "Kata Benda",
            "segments": [seg("あの 方", "あの かた")],
            "example": ex([seg("あの 方", "あの かた"), seg("は"), seg("田中先生", "たなかせんせい"), seg("です。")], "Orang itu Pak Tanaka."),
        },
        {
            "id": "k23", "word": "皆さん", "kana": "みなさん", "romaji": "minasan", "meaning": "teman-teman; saudara-saudara", "word_type": "Kata Benda",
            "segments": [seg("皆さん", "みなさん")],
            "example": ex([seg("皆さん", "みなさん"), seg("、"), seg("はじめまして", "はじめまして"), seg("。")], "Teman-teman, perkenalkan."),
        },
        {
            "id": "k24", "word": "会社", "kana": "かいしゃ", "romaji": "kaisha", "meaning": "perusahaan; kantor", "word_type": "Kata Benda",
            "segments": [seg("会社", "かいしゃ")],
            "example": ex([seg("あれは"), seg("田中先生", "たなかせんせい"), seg("の"), seg("会社", "かいしゃ"), seg("です。")], "Itu perusahaan Pak Tanaka."),
        },
        {
            "id": "k25", "word": "車", "kana": "くるま", "romaji": "kuruma", "meaning": "mobil", "word_type": "Kata Benda",
            "segments": [seg("車", "くるま")],
            "example": ex([seg("これは"), seg("わたし", "わたし"), seg("の"), seg("車", "くるま"), seg("です。")], "Ini mobil saya."),
        },
        {
            "id": "k26", "word": "友達", "kana": "ともだち", "romaji": "tomodachi", "meaning": "teman", "word_type": "Kata Benda",
            "segments": [seg("友達", "ともだち")],
            "example": ex([seg("サントスさん"), seg("は"), seg("わたし", "わたし"), seg("の"), seg("友達", "ともだち"), seg("です。")], "Pak Santos teman saya."),
        },
        {
            "id": "k27", "word": "はい", "kana": "はい", "romaji": "hai", "meaning": "ya", "word_type": "Ungkapan",
            "segments": [seg("はい", "はい")],
            "example": ex([seg("はい", "はい"), seg("、"), seg("学生", "がくせい"), seg("です。")], "Ya, (saya) mahasiswa."),
        },
        {
            "id": "k28", "word": "いいえ", "kana": "いいえ", "romaji": "iie", "meaning": "tidak (menegaskan penolakan)", "word_type": "Ungkapan",
            "segments": [seg("いいえ", "いいえ")],
            "example": ex([seg("いいえ", "いいえ"), seg("、"), seg("学生", "がくせい"), seg("じゃありません。")], "Tidak, (saya) bukan mahasiswa."),
        },
    ],
    "kanji": [
        {
            "id": "j01", "character": "人", "onyomi": "ジン・ニン", "kunyomi": "ひと", "meaning": "orang", "stroke_count": 2,
            "jukugo": [
                {"word": "日本人", "kana": "にほんじん", "meaning": "orang Jepang", "segments": [seg("日本人", "にほんじん")]},
                {"word": "あの人", "kana": "あのひと", "meaning": "orang itu", "segments": [seg("あの", "あの"), seg("人", "ひと")]},
            ],
        },
        {
            "id": "j02", "character": "日", "onyomi": "ニチ・ジツ", "kunyomi": "ひ", "meaning": "hari; matahari", "stroke_count": 4,
            "jukugo": [
                {"word": "日本", "kana": "にほん", "meaning": "Jepang", "segments": [seg("日本", "にほん")]},
                {"word": "毎日", "kana": "まいにち", "meaning": "setiap hari", "segments": [seg("毎日", "まいにち")]},
            ],
        },
        {
            "id": "j03", "character": "本", "onyomi": "ホン", "kunyomi": "もと", "meaning": "asal; buku", "stroke_count": 5,
            "jukugo": [
                {"word": "日本", "kana": "にほん", "meaning": "Jepang", "segments": [seg("日本", "にほん")]},
                {"word": "本", "kana": "ほん", "meaning": "buku", "segments": [seg("本", "ほん")]},
            ],
        },
        {
            "id": "j04", "character": "私", "onyomi": "シ", "kunyomi": "わたし", "meaning": "saya; pribadi", "stroke_count": 7,
            "jukugo": [
                {"word": "私", "kana": "わたし", "meaning": "saya", "segments": [seg("私", "わたし")]},
                {"word": "私たち", "kana": "わたしたち", "meaning": "kami", "segments": [seg("私たち", "わたしたち")]},
            ],
        },
        {
            "id": "j05", "character": "会", "onyomi": "カイ", "kunyomi": "あ(う)", "meaning": "bertemu; pertemuan", "stroke_count": 6,
            "jukugo": [
                {"word": "会社", "kana": "かいしゃ", "meaning": "perusahaan", "segments": [seg("会社", "かいしゃ")]},
                {"word": "会議", "kana": "かいぎ", "meaning": "rapat", "segments": [seg("会議", "かいぎ")]},
            ],
        },
        {
            "id": "j06", "character": "社", "onyomi": "シャ", "kunyomi": "—", "meaning": "perusahaan; tempat menyembah", "stroke_count": 7,
            "jukugo": [
                {"word": "会社", "kana": "かいしゃ", "meaning": "perusahaan", "segments": [seg("会社", "かいしゃ")]},
                {"word": "社員", "kana": "しゃいん", "meaning": "karyawan", "segments": [seg("社員", "しゃいん")]},
            ],
        },
        {
            "id": "j07", "character": "先", "onyomi": "セン", "kunyomi": "さき", "meaning": "depan; lebih dulu", "stroke_count": 5,
            "jukugo": [
                {"word": "先生", "kana": "せんせい", "meaning": "guru", "segments": [seg("先生", "せんせい")]},
                {"word": "先週", "kana": "せんしゅう", "meaning": "minggu lalu", "segments": [seg("先週", "せんしゅう")]},
            ],
        },
        {
            "id": "j08", "character": "生", "onyomi": "セイ", "kunyomi": "い(きる)・う(まれる)", "meaning": "hidup; lahir", "stroke_count": 5,
            "jukugo": [
                {"word": "先生", "kana": "せんせい", "meaning": "guru", "segments": [seg("先生", "せんせい")]},
                {"word": "学生", "kana": "がくせい", "meaning": "mahasiswa", "segments": [seg("学生", "がくせい")]},
            ],
        },
        {
            "id": "j09", "character": "学", "onyomi": "ガク", "kunyomi": "まな(ぶ)", "meaning": "belajar", "stroke_count": 8,
            "jukugo": [
                {"word": "学生", "kana": "がくせい", "meaning": "mahasiswa", "segments": [seg("学生", "がくせい")]},
                {"word": "大学", "kana": "だいがく", "meaning": "universitas", "segments": [seg("大学", "だいがく")]},
            ],
        },
    ],
    "kaiwa": {
        "judul": "はじめまして — Salam Perkenalan",
        "latar": "Di ruang istirahat sekolah bahasa Jepang, Mike Miller (Amerika) bertemu Carlos Santos (Brasil), yang kemudian memperkenalkan temannya, Marie Schmidt (Jerman).",
        "dialog": [
            {
                "speaker": "サントス", "speaker_reading": "Santos",
                "segments": [seg("はじめまして", "はじめまして"), seg("。"), seg("カルロス・サントス", "カルロス・サントス"), seg("です", "です"), seg("。")],
                "translation": "Perkenalkan, saya Carlos Santos.",
            },
            {
                "speaker": "ミラー", "speaker_reading": "Mirā",
                "segments": [seg("はじめまして", "はじめまして"), seg("。"), seg("マイク・ミラー", "マイク・ミラー"), seg("です", "です"), seg("。"), seg("アメリカ", "アメリカ"), seg("から", "から"), seg("きました", "きました"), seg("。")],
                "translation": "Perkenalkan, saya Mike Miller. Saya datang dari Amerika.",
            },
            {
                "speaker": "サントス", "speaker_reading": "Santos",
                "segments": [seg("私", "わたし"), seg("は", "は"), seg("ブラジル", "ブラジル"), seg("から", "から"), seg("きました", "きました"), seg("。"), seg("こちらは", "こちらは"), seg("マリー・シュミットさん", "マリー・シュミットさん"), seg("です", "です"), seg("。")],
                "translation": "Saya datang dari Brasil. Ini adalah Marie Schmidt.",
            },
            {
                "speaker": "シュミット", "speaker_reading": "Shumitto",
                "segments": [seg("はじめまして", "はじめまして"), seg("。"), seg("マリー・シュミット", "マリー・シュミット"), seg("です", "です"), seg("。"), seg("どうぞ よろしく", "どうぞ よろしく"), seg("。")],
                "translation": "Perkenalkan, saya Marie Schmidt. Salam kenal.",
            },
            {
                "speaker": "ミラー", "speaker_reading": "Mirā",
                "segments": [seg("ミラー", "ミラー"), seg("です", "です"), seg("。"), seg("どうぞ よろしく", "どうぞ よろしく"), seg("。")],
                "translation": "Saya Miller. Salam kenal.",
            },
            {
                "speaker": "サントス", "speaker_reading": "Santos",
                "segments": [seg("シュミットさん", "シュミットさん"), seg("は", "は"), seg("デザイナー", "デザイナー"), seg("です", "です"), seg("。")],
                "translation": "Nona Schmidt adalah desainer.",
            },
            {
                "speaker": "ミラー", "speaker_reading": "Mirā",
                "segments": [seg("あの 方", "あの かた"), seg("は", "は"), seg("だれ", "だれ"), seg("です", "です"), seg("か", "か"), seg("。")],
                "translation": "Siapa orang itu?",
            },
            {
                "speaker": "シュミット", "speaker_reading": "Shumitto",
                "segments": [seg("あの 方", "あの かた"), seg("は", "は"), seg("田中先生", "たなかせんせい"), seg("です", "です"), seg("。"), seg("日本語", "にほんご"), seg("の", "の"), seg("先生", "せんせい"), seg("です", "です"), seg("。")],
                "translation": "Orang itu Pak Tanaka. Beliau guru bahasa Jepang.",
            },
        ],
    },
    "quiz_bunpo": [
        {
            "id": "qb1",
            "question_segments": [seg("わたし", "わたし"), seg("＿＿"), seg("マイク・ミラー"), seg("です。")],
            "options": ["は", "を", "が", "も"], "answer_index": 0,
            "correct_segments": [seg("わたし", "わたし"), seg("は"), seg("マイク・ミラー"), seg("です。")],
            "highlight_text": "は", "rumus": "[Kata Benda] は [Kata Benda] です",
            "explanation": "は adalah partikel topik yang dibaca “wa” — “わたしは マイク・ミラーです。” berarti “Saya Mike Miller.” Partikel も berarti “juga”, sedangkan を/が belum dipelajari di Bab 1 dan tidak cocok menandai topik.",
        },
        {
            "id": "qb2",
            "question_segments": [seg("サントスさん"), seg("＿＿"), seg("学生", "がくせい"), seg("じゃありません。")],
            "options": ["は", "か", "の", "も"], "answer_index": 0,
            "correct_segments": [seg("サントスさん"), seg("は"), seg("学生", "がくせい"), seg("じゃありません。")],
            "highlight_text": "は", "rumus": "[Kata Benda] は [Kata Benda] じゃありません",
            "explanation": "Kalimat negatif tetap memakai partikel topik は. じゃありません adalah bentuk negatif dari です yang berarti “bukan”.",
        },
        {
            "id": "qb3",
            "question_segments": [seg("あなた"), seg("は"), seg("学生", "がくせい"), seg("です"), seg("＿＿。")],
            "options": ["か", "が", "も", "の"], "answer_index": 0,
            "correct_segments": [seg("あなた"), seg("は"), seg("学生", "がくせい"), seg("です"), seg("か。")],
            "highlight_text": "か", "rumus": "[Kata Benda] は [Kata Benda] ですか",
            "explanation": "Partikel か di akhir kalimat mengubahnya menjadi pertanyaan “ya/tidak”. Dalam tulisan Jepang standar tidak ada tanda tanya “?”.",
        },
        {
            "id": "qb4",
            "question_segments": [seg("ミラーさん"), seg("は"), seg("会社員", "かいしゃいん"), seg("です。"), seg("サントスさん"), seg("＿＿"), seg("会社員", "かいしゃいん"), seg("です。")],
            "options": ["も", "は", "か", "の"], "answer_index": 0,
            "correct_segments": [seg("サントスさん"), seg("も"), seg("会社員", "かいしゃいん"), seg("です。")],
            "highlight_text": "も", "rumus": "[Kata Benda] も [Kata Benda] です",
            "explanation": "も berarti “juga” dan MENGGANTIKAN は di kalimat kedua — “サントスさんも 会社員です。” = Pak Santos juga pegawai perusahaan.",
        },
        {
            "id": "qb5",
            "question_segments": [seg("あの 方", "あの かた"), seg("は"), seg("＿＿"), seg("です"), seg("か。")],
            "options": ["だれ", "学生", "先生", "会社員"], "answer_index": 0,
            "correct_segments": [seg("あの 方", "あの かた"), seg("は"), seg("だれ"), seg("です"), seg("か。")],
            "highlight_text": "だれ", "rumus": "[Kata Benda] は [Kata Tanya] ですか",
            "explanation": "だれ = “siapa”. Kata tanya Jepang tetap di posisi jawabannya (setelah は), tidak dipindah ke depan kalimat.",
        },
        {
            "id": "qb6",
            "question_segments": [seg("田中先生", "たなかせんせい"), seg("は"), seg("日本語", "にほんご"), seg("＿＿"), seg("先生", "せんせい"), seg("です。")],
            "options": ["の", "は", "も", "か"], "answer_index": 0,
            "correct_segments": [seg("田中先生", "たなかせんせい"), seg("は"), seg("日本語", "にほんご"), seg("の"), seg("先生", "せんせい"), seg("です。")],
            "highlight_text": "の", "rumus": "[Kata Benda 1] の [Kata Benda 2]",
            "explanation": "の menghubungkan dua kata benda: 日本語の 先生 = “guru bahasa Jepang”. Kata benda sebelum の adalah pemilik/kategori dari kata benda sesudahnya.",
        },
        {
            "id": "qb7",
            "question_text": "“Pak Santos bukan mahasiswa.”",
            "options": [
                "サントスさんは 学生です。",
                "サントスさんは 学生じゃありません。",
                "サントスさんも 学生です。",
                "サントスさんは 学生ですか。",
            ],
            "answer_index": 1,
            "correct_segments": [seg("サントスさん"), seg("は"), seg("学生", "がくせい"), seg("じゃありません。")],
            "highlight_text": "じゃありません", "rumus": "[Kata Benda] は [Kata Benda] じゃありません",
            "explanation": "じゃありません = bentuk negatif dari です (“bukan”). Bentuk lebih formalnya では ありません. Opsi lain berarti “mahasiswa”, “juga mahasiswa”, dan “apakah mahasiswa?”.",
        },
    ],
    "quiz_susun": [
        {
            "id": "qs1", "translation": "Saya Mike Miller.",
            "correct_order": [seg("わたし", "わたし"), seg("は"), seg("マイク・ミラー"), seg("です")],
            "distractors": [seg("じゃありません"), seg("か")],
        },
        {
            "id": "qs2", "translation": "Pak Santos bukan mahasiswa.",
            "correct_order": [seg("サントスさん"), seg("は"), seg("学生", "がくせい"), seg("じゃありません")],
            "distractors": [seg("です"), seg("も")],
        },
        {
            "id": "qs3", "translation": "Apakah Anda mahasiswa?",
            "correct_order": [seg("あなた"), seg("は"), seg("学生", "がくせい"), seg("です"), seg("か")],
            "distractors": [seg("じゃありません"), seg("わたし")],
        },
        {
            "id": "qs4", "translation": "Pak Tanaka adalah guru bahasa Jepang.",
            "correct_order": [seg("田中先生", "たなかせんせい"), seg("は"), seg("日本語", "にほんご"), seg("の"), seg("先生", "せんせい"), seg("です")],
            "distractors": [seg("じゃありません"), seg("が")],
        },
        {
            "id": "qs5", "translation": "Nona Schmidt juga desainer.",
            "correct_order": [seg("シュミットさん"), seg("も"), seg("デザイナー"), seg("です")],
            "distractors": [seg("は"), seg("じゃありません")],
        },
    ],
}


def _bab1_doc() -> dict:
    return {
        "number": 1,
        "book": 1,
        "title": "わたしは マイク・ミラーです。",
        "title_translation": "Saya Mike Miller.",
        "has_content": True,
        "content": BAB1_CONTENT,
    }


async def main() -> None:
    await ensure_indexes()
    from seed_data.bab02_09 import CHAPTERS as CH_02_09
    from seed_data.bab10_17 import CHAPTERS as CH_10_17
    from seed_data.bab18_25 import CHAPTERS as CH_18_25
    from seed_data.bab26_30 import CHAPTERS as CH_26_30
    from seed_data.bab31_35 import CHAPTERS as CH_31_35
    from seed_data.bab36_40 import CHAPTERS as CH_36_40
    from seed_data.bab41_45 import CHAPTERS as CH_41_45
    from seed_data.bab46_50 import CHAPTERS as CH_46_50

    authored = {c["number"]: c for c in [_bab1_doc(), *CH_02_09, *CH_10_17, *CH_18_25, *CH_26_30, *CH_31_35, *CH_36_40, *CH_41_45, *CH_46_50]}
    for n in range(1, 51):
        doc = authored.get(n) or _locked_doc(n)
        await db.chapters.replace_one({"number": n}, doc, upsert=True)
    total = await db.chapters.count_documents({})
    with_content = await db.chapters.count_documents({"has_content": True})
    print(f"seed ok: {total} chapters ({with_content} with content)")


if __name__ == "__main__":
    asyncio.run(main())
