const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (texto) => new Promise((resolve) => rl.question(texto, resolve));

async function iniciarBot() {
    console.log('⏳ Iniciando el motor de WhatsApp. Espera unos segundos...');
    
    const { state, saveCreds } = await useMultiFileAuthState('sesion_bot');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['Bot Rosario', 'Chrome', '1.0.0']
    });

    if (!sock.authState.creds.me && !sock.authState.creds.registered) {
        console.log('📱 Preparando solicitud de vinculación...');
        setTimeout(async () => {
            const numero = await question('\n👉 Ingresa el numero de WhatsApp del bot (ej: 549341xxxxxxx sin el 15): ');
            const codigo = await sock.requestPairingCode(numero);
            console.log(`\n⚠️ TU CODIGO DE EMPAREJAMIENTO ES: ${codigo} ⚠️`);
            console.log('Abre WhatsApp en el celular -> Dispositivos Vinculados -> "Vincular con numero de telefono".\n');
        }, 3000);
    } else {
        console.log('🔄 Sesión anterior detectada. Intentando reconectar...');
    }

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'open') {
            console.log('✅ ¡Bot conectado exitosamente! Mandale un "Hola" desde otro celular para probar.');
        } else if (connection === 'close') {
            console.log('❌ Conexión cerrada. Presiona Ctrl+C y vuelve a iniciar.');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        const mensaje = m.messages[0];
        if (!mensaje.message || mensaje.key.fromMe) return;

        const remitente = mensaje.key.remoteJid;
        const textoMensaje = mensaje.message.conversation || mensaje.message.extendedTextMessage?.text;

        if (textoMensaje) {
            console.log(`Mensaje recibido de ${remitente}: ${textoMensaje}`);
            if (textoMensaje.toLowerCase().includes('hola')) {
                await sock.sendMessage(remitente, { text: '¡Hola! Soy el bot del radar comunitario. Enviame una foto del humo para analizarla.' });
            }
        }
    });
}

iniciarBot();