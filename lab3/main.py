from telegram import Update, ReplyKeyboardMarkup, KeyboardButton
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters, ContextTypes
from telegram.constants import ChatAction
import logging
from groq import Groq
import os

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

user_modes = {}
user_history = {}
# Attempt to load a local .env file if python-dotenv is installed (optional)
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

# Read secrets from environment variables. Set these in your environment
# or create a `lab3/.env` file (not checked into git) using the keys from
# `lab3/.env.example`.
TOKENTG = os.getenv("TOKENTG")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not TOKENTG or not GROQ_API_KEY:
    logger.error("Required environment variables TOKENTG or GROQ_API_KEY are not set.")
    raise SystemExit("Missing required environment variables: TOKENTG and/or GROQ_API_KEY")

def create_main_menu():
    keyboard = [
        [KeyboardButton("👤 Студент")],
        [KeyboardButton("💻 IT-технології")],
        [KeyboardButton("📞 Контакти")],
        [KeyboardButton("🤖 Prompt ChatGPT")],
        [KeyboardButton("🏠 Головне меню")]
    ]
    return ReplyKeyboardMarkup(keyboard, resize_keyboard=True)

# Команда /start
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    user_modes[user_id] = "menu"
    
    welcome_text = (
        "👋 Вітаю! Я Telegram-бот для лабораторної роботи №3.\n\n"
        "Оберіть розділ з меню нижче:"
    )
    
    await update.message.reply_text(
        welcome_text,
        reply_markup=create_main_menu()
    )

async def student_info(update: Update, context: ContextTypes.DEFAULT_TYPE):
    student_text = (
        "👤 *Інформація про студента*\n\n"
        "📝 Прізвище: Цуря Олег\n"
        "🎓 Група: ІО-21\n"
        "🏫 Курс: 4\n"
        "📚 Спеціальність: Комп'ютерна інженерія"
    )
    await update.message.reply_text(student_text, parse_mode="Markdown")

async def it_technologies(update: Update, context: ContextTypes.DEFAULT_TYPE):
    tech_text = (
        "💻 *IT-технології використані в проекті:*\n\n"
        "🐍 *Python 3.13*\n"
        "   • Основна мова програмування\n\n"
        "📱 *python-telegram-bot 20.8*\n"
        "   • Бібліотека для роботи з Telegram Bot API\n"
        "   • Асинхронна обробка повідомлень\n\n"
        "🤖 *Groq API (GPT-OSS-120B)*\n"
        "   • Швидка інтеграція з AI моделями\n"
        "   • Потокова обробка відповідей\n"
        "   • Високопродуктивні LLM моделі\n\n"
        "☁️ *PythonAnywhere*\n"
        "   • Безкоштовний хостинг для деплою\n\n"
    )
    await update.message.reply_text(tech_text, parse_mode="Markdown")

async def contacts(update: Update, context: ContextTypes.DEFAULT_TYPE):
    contacts_text = (
        "📞 <b>Контактна інформація:</b>\n\n"
        "📧 Email: o.tsuria@gmail.com\n"
        "📱 Телефон: +380 (68) 892-19-25\n"
        "💬 Telegram: @o_tsuria\n"
    )
    await update.message.reply_text(contacts_text, parse_mode="HTML")

async def chatgpt_mode(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    user_modes[user_id] = "chatgpt"
    
    if user_id not in user_history:
        user_history[user_id] = []
    
    info_text = (
        "🤖 *Режим ChatGPT активовано*\n\n"
        "Тепер ви можете ставити будь-які питання, "
        "і я передам їх ChatGPT для відповіді.\n\n"
        "💡 *Підказки:*\n"
        "• Пишіть питання природною мовою\n"
        "• ChatGPT запам'ятовує контекст розмови\n"
        "• Для скидання історії використайте /clear\n\n"
        "Щоб повернутися до головного меню, "
        "натисніть кнопку '🏠 Головне меню'"
    )
    await update.message.reply_text(info_text, parse_mode="Markdown")

async def chatgpt_reply(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    
    await context.bot.send_chat_action(
        chat_id=update.effective_chat.id, 
        action=ChatAction.TYPING
    )
    
    try:
        text = update.message.text
        
        if user_id not in user_history:
            user_history[user_id] = []
        
        user_history[user_id].append({
            "role": "user",
            "content": text
        })
        
        if len(user_history[user_id]) > 20:
            user_history[user_id] = user_history[user_id][-20:]
        
        completion = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {"role": "system", "content": "Ти корисний асистент, який допомагає студентам з їхніми питаннями. Відповідай українською мовою."},
                *user_history[user_id]
            ],
            temperature=1,
            max_completion_tokens=8192,
            top_p=1,
            reasoning_effort="medium",
            stream=True,
            stop=None
        )
    
        reply_text = ""
        for chunk in completion:
            if chunk.choices and len(chunk.choices) > 0:
                delta = chunk.choices[0].delta
                if delta and delta.content:
                    reply_text += delta.content
        
        if not reply_text or not reply_text.strip():
            await update.message.reply_text(
                "❌ Не вдалося отримати відповідь від AI. Спробуйте ще раз."
            )
            return
        
        user_history[user_id].append({
            "role": "assistant",
            "content": reply_text
        })
        
        # Якщо відповідь занадто довга, розбиваємо її
        if len(reply_text) > 4000:
            for i in range(0, len(reply_text), 4000):
                await update.message.reply_text(reply_text[i:i+4000])
        else:
            await update.message.reply_text(reply_text)
        
    except Exception as e:
        error_message = str(e).lower()
        
        if "authentication" in error_message or "api key" in error_message or "unauthorized" in error_message:
            logger.error("Неправильний API ключ Groq")
            error_text = (
                "❌ *Помилка автентифікації*\n\n"
                "API ключ Groq неправильний або недійсний.\n"
                "Будь ласка, перевірте налаштування."
            )
            await update.message.reply_text(error_text, parse_mode="Markdown")
        elif "rate limit" in error_message or "quota" in error_message:
            logger.error("Перевищено ліміт запитів Groq")
            error_text = (
                "⏱ *Перевищено ліміт запитів*\n\n"
                "Спробуйте ще раз через декілька секунд."
            )
            await update.message.reply_text(error_text, parse_mode="Markdown")
        elif "api" in error_message or "server" in error_message:
            logger.error(f"Помилка API Groq: {e}")
            error_text = (
                "❌ *Помилка сервера Groq*\n\n"
                "Спробуйте ще раз пізніше."
            )
            await update.message.reply_text(error_text, parse_mode="Markdown")
        else:
            logger.error(f"Неочікувана помилка: {e}")
            error_text = (
                "❌ Виникла несподівана помилка.\n\n"
                f"Деталі: {str(e)[:200]}\n\n"
                "Спробуйте ще раз або поверніться до головного меню."
            )
            await update.message.reply_text(error_text)
        
    except Exception as e:
        logger.error(f"Неочікувана помилка: {e}")
        error_text = (
            "❌ Виникла несподівана помилка.\n\n"
            f"Деталі: {str(e)[:200]}\n\n"
            "Спробуйте ще раз або поверніться до головного меню."
        )
        await update.message.reply_text(error_text)

async def clear_history(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    if user_id in user_history:
        user_history[user_id] = []
    await update.message.reply_text(
        "🗑 Історію розмови очищено!\n"
        "Можете почати нову розмову з ChatGPT."
    )

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    text = update.message.text
    
    mode = user_modes.get(user_id, "menu")
    print(text)
    if text == "👤 Студент":
        await student_info(update, context)
    elif text == "💻 IT-технології":
        await it_technologies(update, context)
    elif text == "📞 Контакти":
        await contacts(update, context)
    elif text == "🤖 Prompt ChatGPT":
        await chatgpt_mode(update, context)
    elif text == "🏠 Головне меню":
        user_modes[user_id] = "menu"
        await start(update, context)
    elif mode == "chatgpt":
        await chatgpt_reply(update, context)
    else:
        await update.message.reply_text(
            "Будь ласка, оберіть пункт з меню.",
            reply_markup=create_main_menu()
        )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    help_text = (
        "📖 *Довідка по боту:*\n\n"
        "*Команди:*\n"
        "/start - Запустити бота\n"
        "/help - Показати цю довідку\n"
        "/clear - Очистити історію ChatGPT\n\n"
        "*Розділи меню:*\n"
        "👤 Студент - Інформація про студента\n"
        "💻 IT-технології - Використані технології\n"
        "📞 Контакти - Контактна інформація\n"
        "🤖 Prompt ChatGPT - Чат з AI\n"
        "🏠 Головне меню - Повернутися до меню"
    )
    await update.message.reply_text(help_text, parse_mode="Markdown")

async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE):
    logger.error(f"Exception while handling an update: {context.error}")

def main():
    app = ApplicationBuilder().token(TOKENTG).build()
    
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("clear", clear_history))
    
    app.add_handler(MessageHandler(
        filters.TEXT & ~filters.COMMAND, 
        handle_message
    ))
    
    app.add_error_handler(error_handler)
    
    logger.info("Бот запущено...")
    logger.info("Натисніть Ctrl+C для зупинки")
    app.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main()