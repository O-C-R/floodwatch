import React from 'react';
import { withRouter, Link } from 'react-router';

var Person = withRouter( React.createClass({
  render: function() {
    return (
      <div className="row">
        <div className="col-lg-2">
          <div className="list-group">
            <Link to="/api/person/tokens" className="list-group-item" activeClassName="list-group-item active">
              Tokens
            </Link>
            <Link to="/api/person/password" className="list-group-item" activeClassName="list-group-item active">
              Password
            </Link>
          </div>
        </div>
        <div className="col-lg-10">
          {this.props.children && React.cloneElement(this.props.children, {
            loadUserFromServer: this.props.loadUserFromServer,
            user: this.props.user
          })}
        </div>
      </div>
    )
  }
}))

export default Person;