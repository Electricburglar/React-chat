import React, { Component } from 'react';
import PropTypes from 'prop-types'
import SideBar from './SideBar'
import { User } from '../../Classes'
import Messages from '../messaging/Messages'
import MessageInput from '../messaging/MessageInput'
import ChatHeading from './ChatHeading'

import { COMMUNITY_CHAT, MESSAGE_RECIEVED, MESSAGE_SENT, TYPING } from '../../Constants'

export default class ChatContainer extends Component {
	
	constructor(props) {
	  super(props);
	
	  this.state = {
	  	activeChat:null,
	  	communityChat:null,
	  	chats:[],
	  };
	  this.resetChat = this.resetChat.bind(this)
	  this.removeSocketEvents = this.removeSocketEvents.bind(this)
	  this.socketEvents = []
	}

	componentDidMount() {
		const { socket } = this.props
		socket.emit(COMMUNITY_CHAT, this.resetChat)
		this.initSocket()
	}

	componentWillUnmount() {
		this.deinitialize()
	}
		
	initSocket(){
		const { socket } = this.props
		socket.on('connect', ()=>{
			socket.emit(COMMUNITY_CHAT, this.resetChat)
		})
	}

	deinitialize(){
		const { socket } = this.props
		this.removeSocketEvents(socket, this.socketEvents)
	}

	removeSocketEvents(socket, events){

		if(events.length > 0){
			socket.off(events[0])
			this.removeSocketEvents(socket, events.slice(1))
		}
	}

	resetChat(chat){
		return this.addChat(chat, true)
	}

	addChat(chat, reset){
		const { socket } = this.props
		const { chats } = this.state
		const newChats = reset ? [chat] : [...chats, chat]
		
		this.setState({chats:newChats, activeChat:chat})
		
		const messageEvent = `${MESSAGE_RECIEVED}-${chat.id}`
		const typingEvent = `${TYPING}-${chat.id}`

		socket.on(messageEvent, this.addMessageToChat(chat.id))
		socket.on(typingEvent, this.updateTypingInChat(chat.id))
		
		this.socketEvents.push(messageEvent, typingEvent)
	}

	addMessageToChat(chatId){
		return message =>{
			const { chats } = this.state
			let newChats = chats.map((chat) => {
				if(chat.id === chatId)
					chat.messages.push(message)
				return chat;
			})
			this.setState({chats:newChats})
		}
	}

	updateTypingInChat(chatId){
		return ({isTyping, user}) =>{
					if(user !== this.props.user.name){

						const { chats } = this.state
						let newChats = chats.map((chat) => {
							if(chat.id === chatId){
								if(isTyping && !chat.typingUsers.includes(user))
									chat.typingUsers.push(user)
								else if(!isTyping && chat.typingUsers.includes(user))
									chat.typingUsers = chat.typingUsers.filter(u => u !== user)
							}
							return chat;
						})
						this.setState({chats:newChats})
					}
				}
	}

	sendMessage(chatId, message){
 
		const { socket } = this.props

		socket.emit(MESSAGE_SENT, {chatId, message})
		
	}

	sendTyping(chatId, isTyping){

		const { socket } = this.props
		socket.emit(TYPING, {chatId, isTyping})
		
	}

	setActiveChat(chat){
		this.setState({activeChat:chat})
	}

	render() {
		const { user, logout } = this.props 
		const { activeChat, chats } = this.state
		return (
			<div className="container">
				<SideBar 
					logout={logout}
					chats={chats} 
					user={user}
					activeChat={activeChat}
					setActiveChat={ (chat)=> this.setActiveChat(chat) }/>		

				<div className="chat-room-container">
					{
						activeChat !== null ? (
							<div className="chat-room">
								<ChatHeading 
									name={activeChat.name} 
									online={true} />
								<Messages 
									messages={activeChat.messages} 
									user={user} 
									typingUsers={activeChat.typingUsers}/>
								
								<MessageInput 
									sendMessage={
										(message)=>{ 
											this.sendMessage(activeChat.id, message) 
										}
									} 
									sendTyping={
										(isTyping)=>{ 
											this.sendTyping(activeChat.id, isTyping) 
										}
									}
									/>
							</div>
							)
						: 
							<div className="chat-room choose">
								<h3>Choose a chat</h3>
							</div>
					}
				</div>
			</div>
		);
	}
}

ChatContainer.propTypes = {
	socket:PropTypes.object,
	user:PropTypes.shape(User).isRequired
}