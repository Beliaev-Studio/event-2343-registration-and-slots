const winston = require('winston')

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
})

const token = process.env.TOKEN
const slotsList = {
  '5 ноября': {
    1: [
      '10:00',
      '10:20',
      '10:40',
      '11:00',
      '11:20',
      '12:00',
      '12:20',
      '12:40',
      '13:00',
      '13:20',
      '14:00',
      '14:20',
      '14:40',
      '15:00',
      '15:20',
      '16:00',
      '16:20',
      '16:40',
      '17:00',
      '17:20',
      '17:40',
    ],
    2: [
      '10:00',
      '10:20',
      '10:40',
      '11:00',
      '11:40',
      '12:00',
      '12:20',
      '12:40',
      '13:00',
      '13:40',
      '14:00',
      '14:20',
      '14:40',
      '15:00',
      '15:40',
      '16:00',
      '16:20',
      '16:40',
      '17:00',
      '17:20',
      '17:40',
    ]
  },
  '6 ноября': {
    1: [
      '10:00',
      '10:20',
      '10:40',
      '11:00',
      '11:20',
      '12:00',
      '12:20',
      '12:40',
      '13:00',
      '13:20',
      '14:00',
      '14:20',
      '14:40',
      '15:00',
      '15:20',
      '16:00',
      '16:20',
      '16:40',
      '17:00',
      '17:20',
      '17:40',
    ],
    2: [
      '10:00',
      '10:20',
      '10:40',
      '11:00',
      '11:40',
      '12:00',
      '12:20',
      '12:40',
      '13:00',
      '13:40',
      '14:00',
      '14:20',
      '14:40',
      '15:00',
      '15:40',
      '16:00',
      '16:20',
      '16:40',
      '17:00',
      '17:20',
      '17:40',
    ]
  },
  '7 ноября': {
    1: [
      '10:00',
      '10:20',
      '10:40',
      '11:00',
      '11:20',
      '12:00',
      '12:20',
      '12:40',
      '13:00',
      '13:20',
      '14:00',
      '14:20',
      '14:40',
      '15:00',
      '15:20',
      '16:00',
      '16:20',
      '16:40',
      '17:00',
      '17:20',
      '17:40',
    ],
    2: [
      '10:00',
      '10:20',
      '10:40',
      '11:00',
      '11:40',
      '12:00',
      '12:20',
      '12:40',
      '13:00',
      '13:40',
      '14:00',
      '14:20',
      '14:40',
      '15:00',
      '15:40',
      '16:00',
      '16:20',
      '16:40',
      '17:00',
      '17:20',
      '17:40',
    ]
  }
}

module.exports.handler = async function (event, context) {
  const referer = event.headers['Referer'] || ''
  const origin = event.headers['Origin'] || ''
  const sandboxHeader = event.headers['X-Sandbox'] || 0
  const isSandbox = referer.includes(':8000') || origin.includes(':8000') || sandboxHeader

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Headers': '*'
      }
    }
  }

  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Allow': 'GET, POST',
        'Access-Control-Allow-Headers': '*'
      }
    }
  }

  if (event.httpMethod === 'GET') {
    try {
      let slots = await getSlots(isSandbox)

      if (typeof slots !== 'object' || slots === null || Object.keys(slots).length === 0) {
        console.error('Ошибка получения свободных слотов')

        throw {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Headers': '*'
          },
          body: JSON.stringify({ errors: [{ message: 'Ошибка получения свободных слотов' }] })
        }
      }

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: slots })
      }
    } catch (e) {
      return e
    }
  }

  if (event.httpMethod === 'POST') {
    try {
      let data = JSON.parse(event.body)

      if (!data['консультация_дата']) {
        logger.error({ message: 'Не заполнено обязательное поле (дата)' })

        throw {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Headers': '*'
          },
          body: JSON.stringify({ errors: [{ message: 'Не заполнено обязательное поле (дата)' }] })
        }
      }

      if (!data['консультация_время'] || !data['консультация_номер_стола']) {
        logger.error({ message: 'Не заполнено обязательное поле (время)' })

        throw {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Headers': '*'
          },
          body: JSON.stringify({ errors: [{ message: 'Не заполнено обязательное поле (время)' }] })
        }
      }

      const consultationDate = data['консультация_дата']
      const consultationTime = data['консультация_время']
      const consultationTable = data['консультация_номер_стола']

      let slots = await getSlots(isSandbox)

      if (typeof slots !== 'object' || slots === null || Object.keys(slots).length === 0) {
        console.error('Ошибка получения свободных слотов')

        throw {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Headers': '*'
          },
          body: JSON.stringify({ errors: [{ message: 'Ошибка получения свободных слотов' }] })
        }
      }

      let checkSFreeSlot = slots[consultationDate] && slots[consultationDate][consultationTable] && slots[consultationDate][consultationTable].includes(consultationTime)

      if (!checkSFreeSlot) {
        logger.error({ message: 'Выбранный слот недоступен' })

        throw {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Headers': '*'
          },
          body: JSON.stringify({ errors: [{ message: 'Выбранный слот недоступен' }] })
        }
      }

      try {
        const participantId = await registerParticipants(origin, isSandbox, data)

        if (!participantId) {
          logger.error('Не был получен ID пользователя')

          throw {
            statusCode: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Headers': '*'
            },
            body: JSON.stringify({ errors: [{ message: 'Не был получен ID пользователя' }] })
          }
        }
      } catch (error) {
        return error
      }

      return {
        statusCode: 200
      }
    } catch (e) {
      return {
        statusCode: e.statusCode || 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Headers': '*'
        },
        body: e.body || JSON.stringify({ errors: [{ message: 'Ответ от сервера не был успешным' }] })
      }
    }
  }
}

const getSlots = async function (isSandbox) {
  let participants = null
  try {
    participants = await getParticipants(isSandbox)

    if (participants && participants.length) {
      removeSlots(participants)
    }

    return slotsList
  } catch (e) {
    logger.error({ message: 'Ответ от сервера не был успешным', exception: e })

    return {
      statusCode: 500,
      body: JSON.stringify({ errors: 'Ответ от сервера не был успешным' })
    }
  }
}

const removeSlots = (participants) => {
  try {
    participants.forEach((item) => {
      let { 'консультация_дата': date, 'консультация_время': time, 'консультация_номер_стола': tableNumber } = item

      if (date && time && tableNumber) {
        if (slotsList[date] && Object.keys(slotsList[date]).length > 0 && slotsList[date][tableNumber].length) {
          slotsList[date][tableNumber] = slotsList[date][tableNumber].filter(slot => slot !== time)
        }
      }
    })
  } catch (error) {
    return {
      statusCode: 420,
      body: JSON.stringify({ errors: error })
    }
  }
}

const getParticipants = async function (isSandbox) {
  const url = new URL(`https://api.depreg.ru/v1/events/2343/participants`)

  if (isSandbox) {
    url.port = '8000'
    logger.debug('Запрос из sandbox-окружения')
  } else {
    logger.debug('Запрос из продакшн-окружения')
  }

  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + token,
    },
  }

  const response = await fetch(url.toString(), options).catch((reason) => {
    logger.error({ message: 'Ошибка Fetch', reason: reason, response: response })

    throw {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Headers': '*'
      },
      body: JSON.stringify({ errors: [{ message: 'Failed to fetch' }] })
    }
  })

  const data = await response.json().catch((reason) => {
    logger.error({ message: 'Ошибка парсинга ответа', reason: reason, response: response })

    throw {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Headers': '*'
      },
      body: JSON.stringify({ errors: [{ message: 'Failed to parse JSON' }] })
    }
  })

  if (!response.ok) {
    logger.error({ message: 'Ответ от сервера не был успешным', response: response })

    throw {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Headers': '*'
      },
      body: JSON.stringify({ errors: data.message })
    }
  }

  return data
}

const registerParticipants = async function (origin, isSandbox, data) {
  let formData = new FormData()
  for (let key in data) {
    formData.append(key, data[key])
  }

  const options = {
    method: 'POST',
    headers: {
      'Referer': origin,
      'X-Sandbox': isSandbox ? '1' : ''
    },
    body: new URLSearchParams(formData)
  }

  const response = await fetch('https://functions.yandexcloud.net/d4e6kjjvt4fnek92dse1', options).catch(() => {
    throw {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Headers': '*'
      },
      body: JSON.stringify({ errors: [{ message: 'Failed to fetch' }] })
    }
  })

  const participant = await response.json().catch(() => {
    throw {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Headers': '*'
      },
      body: JSON.stringify({ errors: [{ message: 'Failed to parse JSON' }] })
    }
  })

  if (!response.ok) {
    throw {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Headers': '*'
      },
      body: JSON.stringify({ errors: [{ message: 'Ошибка регистрации пользователя' }] })
    }
  }

  return participant.id
}
