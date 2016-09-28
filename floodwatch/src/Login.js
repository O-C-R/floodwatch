import React from 'react';
import { withRouter } from 'react-router';
import auth from './auth';

var Login = withRouter( React.createClass({
  getInitialState: function() {
    return {username: '', password: '', error: ''};
  },
  setFormState: function(e) {
    var state = {}
    if(e.target.type === 'checkbox') {
      state[e.target.id] = e.target.checked ? 'on' : ''
    } else {
      state[e.target.id] = e.target.value
    }
    this.setState(state)
  },
  handleSubmit: function(e) {
  	e.preventDefault()
    auth.login(this.state.username, this.state.password)
      .then(() => {
        this.setState({username: '', password: '', error: ''});
        this.props.loadUserFromServer()
          .then(() => {
            this.props.router.push('/user')
          })
      })
      .catch((error) => {
        if(error.response) {
          switch(error.response.status){
            case 429:
            this.setState({error: 'Try again later'})
            return
            case 401:
            this.setState({error: 'Username or password incorrect.'})
            return
          }
        }
        this.setState({error: 'A server error occurred.'})
      })
  },
  componentDidMount: function() {
    this.refs.username.focus();
  },
  render: function() {
    return (
	      <div className="row">
	        <div className="col-md-12">
            <h3>Login.</h3>
            <p></p>
          </div>
          <div className="col-md-12">
            <div class="container">
  	          <form onSubmit={this.handleSubmit}>
  	            <div className="alert alert-danger" role="alert" style={this.state.error ? {} : {display: "none"}}>
  	              <strong>Login failed.</strong> {this.state.error}
  	            </div>
  	            <div className="form-group">
  	              <input type="name" className="form-control" id="username" placeholder="Username" required={true} value={this.state.username} onChange={this.setFormState} ref="username" />
  	            </div>
  	            <div className="form-group">
  	              <input type="password" className="form-control" id="password" placeholder="Password" required={true} value={this.state.password} onChange={this.setFormState} />
  	            </div>
  	            <button type="submit" className="btn btn-primary" id="loginInput">Login</button>
  	          </form>
  	        </div>
          </div>
	      </div>
	    )
  }
}))

export default Login;
