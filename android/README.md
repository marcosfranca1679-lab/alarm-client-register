# 📱 Aplicativo Android WebView — SeguraAlarm

Aplicativo nativo Android desenvolvido em **Kotlin** com suporte completo a **WebView moderna**, integração com **WhatsApp nativo**, suporte a **Puxar para Atualizar (Pull to Refresh)**, barra de carregamento e navegação fluida.

---

## 🚀 Como Trocar o Link da Vercel

Abra o arquivo [`app/src/main/java/com/ws/seguranca/MainActivity.kt`](file:///app/src/main/java/com/ws/seguranca/MainActivity.kt) e altere a constante na linha 25 com o link exato do seu deploy na Vercel:

```kotlin
companion object {
    const val VERCEL_URL = "https://seu-projeto.vercel.app" // <- Coloque seu link aqui
}
```

---

## 🛠️ Como Gerar o APK no Android Studio

1. Abra o **Android Studio**.
2. Clique em **Open Project** e selecione a pasta:
   `C:\Users\souza\.gemini\antigravity\scratch\ws-seguranca-android`
3. Aguarde a sincronização do Gradle.
4. Para gerar o instalador do aplicativo:
   - Vá no menu superior: **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
   - Ao finalizar, clique em **locate** para pegar o arquivo `app-debug.apk`.
5. Transfira o arquivo `.apk` para o seu celular Android e instale!

---

## ✨ Recursos Inclusos:
- 🚀 **Navegação Rápida**: Carrega o site da SeguraAlarm com aceleração de hardware e DOM Storage ativado.
- 💬 **Abertura Direta do WhatsApp**: Ao clicar em qualquer botão de orçamento ou produto, abre o aplicativo nativo do WhatsApp no celular.
- 🔄 **Puxar para Atualizar (SwipeRefresh)**: Arraste para baixo para recarregar os dados do Supabase.
- 📄 **Upload & Download de Documentos**: Suporte a envio de backups JSON e download de termos em PDF.
- 🎨 **Tema Dark Moderno**: Barra de status integrada com o layout da SeguraAlarm.
