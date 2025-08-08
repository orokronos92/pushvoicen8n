'use client'

interface Message {
  text: string
  sender: 'user' | 'n8n'
  timestamp: Date
}

interface ConversationDisplayProps {
  messages: Message[]
  suppressHydrationWarning?: boolean
}

export default function ConversationDisplay({ messages, suppressHydrationWarning }: ConversationDisplayProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 h-[400px] sm:h-[500px] flex flex-col" suppressHydrationWarning={suppressHydrationWarning}>
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Conversation</h2>
      
      <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-center text-sm sm:text-base">
              Aucun message pour le moment.<br />
              Commencez à parler pour voir la conversation ici.
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-lg px-3 sm:px-4 py-2 ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">
                    {message.sender === 'user' ? 'Vous' : 'n8n'}
                  </span>
                  <span className="text-xs opacity-75">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <p className="text-sm break-words">{message.text}</p>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm text-gray-600 space-y-1 sm:space-y-0">
          <span>Messages: {messages.length}</span>
          <span>
            {messages.filter(m => m.sender === 'user').length} de vous,{' '}
            {messages.filter(m => m.sender === 'n8n').length} de n8n
          </span>
        </div>
      </div>
    </div>
  )
}