import React from 'react';
import { withRouter } from 'react-router';
import auth from '../api/auth';

var Register = withRouter( React.createClass({
  getInitialState: function() {
    return {username: '', usernameFeedback: '', password: '', passwordRepeated: '', passwordFeedback: '', email: '', error: ''};
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

    if(this.state.password !== this.state.passwordRepeated) {
      this.setState({passwordFeedback:"Passwords do not match."})
      return
    }

    auth.post("/api/register", {
      username: this.state.username,
      email: this.state.email,
      password: this.state.password
    })
      .then(() => {
        this.setState(this.getInitialState());
      })
      .catch((error) => {
        console.log(error)
        if(error.response && error.response.status === 400) {
          error.response.json().then((errors) => {
            this.setState({usernameFeedback: errors['username'], password: '', passwordRepeated: '', error: ''})
          })
          return
        }
        this.setState({error: 'A server error occurred.'})
      })

  },
  componentDidMount: function() {
    this.refs.username.focus()
  },
  render: function() {
    return (
	      <div className="row">
          <div className="col-md-12">
            <h3>Signup to use Floodwatch.</h3>
          </div>
	        <div className="col-md-12">
	          <div class="container">
              <form onSubmit={this.handleSubmit}>
  	            <div className="alert alert-danger" role="alert" style={this.state.error ? {} : {display: "none"}}>
  	              <strong>Registration failed.</strong> {this.state.error}
  	            </div>
  	            <div className={this.state.usernameFeedback ? "form-group row has-danger" : "form-group row"}>
  	              <label className="col-sm-2 col-form-label" for="username">Username</label>
                  <div className="col-sm-10">
                    <input type="text" className="form-control" id="username" placeholder="Username" required={true}  maxLength="120" pattern="\S{3,}" value={this.state.username} onChange={this.setFormState} ref="username" />
                    {(() => {if(this.state.usernameFeedback){
                      return <div className="form-control-feedback">{this.state.usernameFeedback}</div>
                    }})()}
                    <small id="usernameHelp" className="form-text text-muted">Usernames cannot contain spaces.</small>
                  </div>
  	            </div>
                <div className="form-group row">
                  <label className="col-sm-2 col-form-label" for="email">Email <small className="text-muted">(optional)</small></label>
                  <div className="col-sm-10">
                    <input type="email" className="form-control" id="email" placeholder="Email" value={this.state.email} onChange={this.setFormState} />
                  </div>
                </div>
  	            <div className={this.state.passwordFeedback ? "form-group row has-danger" : "form-group row"}>
                  <label className="col-sm-2 col-form-label" for="password">Password</label>
                  <div className="col-sm-10">
                    <input type="password" className={this.state.passwordFeedback ? "form-control form-control-danger" : "form-control"} id="password" placeholder="Password" minLength="10" required={true} value={this.state.password} onChange={this.setFormState} />
                  </div>
                </div>
                <div className={this.state.passwordFeedback ? "form-group row has-danger" : "form-group row"}>
                  <div className="offset-sm-2 col-sm-10">
                    <input type="password" className={this.state.passwordFeedback ? "form-control form-control-danger" : "form-control"} id="passwordRepeated" placeholder="Retype Password" required={true} value={this.state.passwordRepeated} onChange={this.setFormState} />
                    {(() => {if(this.state.passwordFeedback){
                      return <div className="form-control-feedback">{this.state.passwordFeedback}</div>
                    }})()}
                  </div>
                </div>
                <div className="form-group row">
                  <div className="offset-sm-2 col-sm-10">
                    <button type="submit" className="btn btn-primary" id="loginInput">Register</button>
                  </div>
                </div>
  	          </form>
            </div>
          </div>
	      </div>
	    )
  }
}))

export default Register;
