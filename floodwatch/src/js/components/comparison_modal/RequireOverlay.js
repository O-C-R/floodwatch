// // NOT YET IMPLEMENTED/BEING USED, IGNORE
//
// import React, { Component } from 'react';
// import { Popover, Button } from 'react-bootstrap';
//
// export default class RequireOverlay extends Component {
//   updateUserInfo() {
//     // tk
//   }
//
//   render() {
//     const elems = [];
//
//     // get list of names
//     for (let i = 0; i < this.props.requirements.length; i++) {
//       const index = _.findIndex(
//         FilterJSON.filters,
//         o => o.name == this.props.requirements[i].name,
//       );
//       elems.push(
//         <p>
//           <span className="bold">
//             What is your {this.props.requirements[i].name}?
//           </span>
//         </p>,
//       );
//
//       for (let y = 0; y < FilterJSON.filters[index].options.length; y++) {
//         elems.push(
//           <label>
//             <input type={FilterJSON.filters[index].type} />
//             {' '}
//             {FilterJSON.filters[index].options[y]}
//           </label>,
//         );
//       }
//     }
//
//     return (
//       <Popover
//         {...this.props}
//         id={`requirements-${this.props.myKey}`}
//         className="popover"
//         title="Required information">
//         <p>
//           To access this information, we ask that you provide your own.
//           <br />
//           <br />
//           Please provide the following:
//         </p>
//         {elems}
//         <br />
//         <Button>Cancel</Button>
//         <Button onClick={this.updateUserInfo.bind(this)}>Finish</Button>
//       </Popover>
//     );
//   }
// }
